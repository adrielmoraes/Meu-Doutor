"use server";

/**
 * @fileOverview Fluxo de IA para gerar resumos em áudio (podcast) sobre a saúde do paciente.
 * 
 * VERSÃO CORRIGIDA - Principais mudanças:
 * 1. Corrigido mapeamento de speakers para TTS
 * 2. Melhorado tratamento de erros
 * 3. Adicionada validação de entrada
 * 4. Otimizado consultas paralelas
 * 5. Removido armazenamento de Base64 no banco (usar storage externo)
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { getPatientById, getRecentExamsForPodcast } from "@/lib/db-adapter";
import { trackAIUsage } from "@/lib/usage-tracker";
import { countTextTokens } from "@/lib/token-counter";
import { canUseResource } from "@/lib/subscription-limits";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/server/storage";
import { saveFileBuffer } from "@/lib/file-storage";
import { appointments, healthPodcasts, exams } from "@/shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { isOpenRouterConfigured, openRouterGenerateStructured, openRouterTextToSpeech } from "@/lib/openrouter";


// --- CONSTANTES ---
const SPEAKERS = {
    HOST: "Nathália",
    SPECIALIST: "Dr. Daniel",
} as const;

const TTS_CONFIG = {
    primaryModel: "gemini-3.1-flash-tts-preview",
    fallbackModels: ["gemini-2.5-flash-preview-tts"],
    sampleRate: 24000,
    numChannels: 1,
    bitsPerSample: 16,
} as const;

// --- SCHEMAS ---
const HealthPodcastInputSchema = z.object({
    patientId: z
        .string()
        .min(1, "ID do paciente é obrigatório")
        .describe("O identificador único do paciente."),
});
export type HealthPodcastInput = z.infer<typeof HealthPodcastInputSchema>;

const HealthPodcastOutputSchema = z.object({
    audioUrl: z.string().describe("URL do áudio (Data URI ou URL de storage)."),
    transcript: z.string().describe("A transcrição completa do podcast."),
    durationEstimate: z.number().optional().describe("Duração estimada em segundos."),
});
export type HealthPodcastOutput = z.infer<typeof HealthPodcastOutputSchema>;

// Schema interno para o roteiro
const ScriptLineSchema = z.object({
    speaker: z.enum([SPEAKERS.HOST, SPEAKERS.SPECIALIST]),
    text: z.string(),
});

const PodcastScriptSchema = z.object({
    script: z.array(ScriptLineSchema),
});

// --- TIPOS DE ERRO PERSONALIZADOS ---
class PodcastGenerationError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly recoverable: boolean = false
    ) {
        super(message);
        this.name = "PodcastGenerationError";
    }
}

// --- FUNÇÃO PRINCIPAL EXPORTADA ---
export async function generateHealthPodcast(
    input: HealthPodcastInput
): Promise<{ podcastId: string; status: 'processing' }> {
    // Validação de entrada
    const validatedInput = HealthPodcastInputSchema.safeParse(input);
    if (!validatedInput.success) {
        throw new PodcastGenerationError(
            `Entrada inválida: ${validatedInput.error.message}`,
            "INVALID_INPUT",
            false
        );
    }

    // 1. Limpar / marcar como falhas eventuais sessões anteriores travadas em 'processing'
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        await db.update(healthPodcasts)
            .set({ status: 'failed' })
            .where(
                and(
                    eq(healthPodcasts.patientId, input.patientId),
                    eq(healthPodcasts.status, 'processing'),
                )
            );
    } catch (cleanupErr) {
        console.warn("[Health Podcast] Aviso ao limpar registros anteriores:", cleanupErr);
    }

    // 2. Criar registro inicial no banco
    const podcastId = randomUUID();
    await createInitialPodcastRecord(podcastId, input.patientId);

    // 3. Disparar geração em background (fire-and-forget)
    runBackgroundGeneration(podcastId, validatedInput.data).catch(err => {
        console.error(`[Health Podcast] Erro crítico ao iniciar background job: ${err}`);
        failPodcastRecord(podcastId).catch(e => console.error("Falha ao marcar como failed:", e));
    });

    return { podcastId, status: 'processing' };
}

async function runBackgroundGeneration(podcastId: string, input: HealthPodcastInput) {
    try {
        console.log(`[Health Podcast] Iniciando geração background para ${podcastId}`);
        const result = await healthPodcastFlow(input);
        await completePodcastRecord(podcastId, result.audioUrl, result.transcript);
        console.log(`[Health Podcast] Geração concluída para ${podcastId}`);
    } catch (error) {
        console.error(`[Health Podcast] Falha na geração do podcast ${podcastId}:`, error);
        await failPodcastRecord(podcastId);
    }
}

function formatSafeDate(dateVal: string | Date | null | undefined): string {
    if (!dateVal) return "Sem data";
    if (typeof dateVal === 'string') {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateVal)) return dateVal;
    }
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleDateString("pt-BR");
    } catch {
        return String(dateVal);
    }
}

// --- CONTEXTO DO PACIENTE (OTIMIZADO) ---
async function getPatientContext(patientId: string) {
    // Execução paralela
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const [patient, examsData, upcomingAppointments] = await Promise.all([
        getPatientById(patientId),
        getRecentExamsForPodcast(patientId, 7),
        db.select()
            .from(appointments)
            .where(
                and(
                    eq(appointments.patientId, patientId),
                    eq(appointments.status, 'Agendada'),
                )
            )
            .orderBy(appointments.date)
            .limit(2)
    ]);

    if (!patient) {
        throw new PodcastGenerationError(
            "Paciente não encontrado",
            "PATIENT_NOT_FOUND",
            false
        );
    }

    const examContext = examsData.length > 0
        ? examsData
            .map(
                (e) =>
                    `Exame: ${e.type} (${formatSafeDate(e.date)})\nResultado: ${truncateText((e.preliminaryDiagnosis || e.result || "Sem análise").toString(), 600)}`
            )
            .join("\n\n")
        : "Nenhum exame registrado recentemente.";

    const wellnessContext = patient.wellnessPlan?.preliminaryAnalysis
        ? `Análise de Saúde: ${truncateText(patient.wellnessPlan.preliminaryAnalysis, 600)}`
        : "Sem plano de bem-estar no momento.";

    const agendaContext = upcomingAppointments.length > 0
        ? upcomingAppointments.map(a => `- ${a.type} agendado para ${formatSafeDate(a.date)} às ${a.time}`).join('\n')
        : "Nenhum compromisso agendado.";

    const limitInfo = await canUseResource(patientId, 'podcastMinutes');

    // Mapear duração sugerida baseada na cota do plano e solicitação do usuário
    // 10 falas ~= 1 minuto de áudio (Gemini TTS)
    let targetLines = 22; // Alta qualidade com diálogo dinâmico (~2.5 min)
    if (limitInfo.limit > 5 && limitInfo.limit <= 10) targetLines = 35; // Básico (~3.5 min)
    else if (limitInfo.limit > 10) targetLines = 60; // Premium/Familiar (~6 min)

    // Capped by GenAI typical limits and costs
    targetLines = Math.min(targetLines, 85);

    return {
        patientName: patient.name,
        examContext: truncateText(examContext, 1800),
        wellnessContext: truncateText(wellnessContext, 1200),
        agendaContext,
        targetLines,
        patientId,
    };
}

const PODCAST_PROMPT_TEMPLATE = `
**SUA MISSÃO:** Criar o roteiro para um episódio do "Podcast MediAI", um programa educacional, personalizado e altamente empático que explica a saúde do paciente de forma clara, didática e calorosa.

**PERSONAGENS (USE EXATAMENTE ESTES NOMES):**
1. **${SPEAKERS.HOST}** (Apresentadora): Curiosa, empática e acolhedora. Ela representa a voz do paciente, faz perguntas cotidianas, reage com entusiasmo, surpresa e interesse genuíno, e garante que nenhum termo técnico fique sem explicação simples.
2. **${SPEAKERS.SPECIALIST}** (Especialista Convidado): Uma autoridade médica renomada, extremamente didático, humano e próximo. Ele não apenas informa, ele *ensina*. Usa metáforas acessíveis, detalha o funcionamento do corpo, o porquê dos tratamentos e como os hábitos impactam o bem-estar.

---

### 🎙️ REQUISITO CRUCIAL: NUANCES PARALINGUÍSTICAS E VOCALIZAÇÕES DA FALA
Em uma conversa real de podcast em estúdio, a fala é viva, fluida e pontuada por pequenas vocalizações naturais. **VOCÊ DEVE INCLUIR NATURALMENTE AO LONGO DE TODO O ROTEIRO AS SEGUINTES NUANCES E EXPRESSÕES:**

1. **Sons de Concordância e Escuta Ativa (Backchanneling):**
   - *“Uhum…”*, *“Hum-hum”*, *“Aham”*, *“Arrã”*, *“Sim, com certeza”*, *“Isso!”*, *“Exatamente”*, *“É…”*, *“Pois é…”*, *“Com certeza!”*.
   - Exemplo: "${SPEAKERS.HOST}: Uhum… e quando a taxa de glicose sobe, o que o corpo sente na prática?"
   - Exemplo: "${SPEAKERS.SPECIALIST}: Exatamente, Nathália! É… o que acontece é que as células começam a pedir energia."

2. **Sons de Hesitação Reflexiva e Pensamento:**
   - *“Hum…”*, *“Ééé…”*, *“Ah…”*, *“Aaa…”*, *“Hmm…”*, *“Tipo…”*, *“Assim…”*, *“Então…”*, *“Veja bem…”*.
   - Exemplo: "${SPEAKERS.SPECIALIST}: Hum… veja bem, o colesterol em si não é um vilão. Ééé… na verdade, ele é essencial para a produção de hormônios."

3. **Reações Espontâneas e Descobertas:**
   - *“Ah!”*, *“Nossa!”*, *“Uau!”*, *“Eita!”*, *“Caramba!”*, *“Hmm! Interessante!”*, *“Oh!”*, *“Ô!”*, *“Que alívio!”*.
   - Exemplo: "${SPEAKERS.HOST}: Eita! Então mesmo sem nenhum sintoma, a pressão alta pode estar sobrecarregando o coração?"
   - Exemplo: "${SPEAKERS.SPECIALIST}: Ah! Exatamente isso. Por isso a prevenção é o melhor remédio."

4. **Risadas e Vocalizações Leves de Descontração:**
   - *“Haha”*, *“Hahaha”*, *“Hehe”*, *“hmm-haha”*, *“hehe…”* (ao comentar desafios cotidianos como resistir à sobremesa, preguiça de caminhar, etc).
   - Exemplo: "${SPEAKERS.HOST}: Haha, pois é! A gente sempre promete começar os exercícios na segunda-feira, né?"
   - Exemplo: "${SPEAKERS.SPECIALIST}: Hehe… clássico! Mas começar aos poucos, com 15 minutinhos, já transforma o metabolismo."

5. **Marcadores Conversacionais e Conexão Interpessoal:**
   - *“Né?”*, *“Tá?”*, *“Entendeu?”*, *“Certo?”*, *“Sabe?”*, *“Olha…”*, *“Bom…”*, *“Então…”*, *“Veja bem…”*.

6. **Cadência, Pontuação e Alternância Dinâmica:**
   - Use reticências (\`...\`) para indicar pausas reflexivas naturais de fala e respiração.
   - Use interrogações e exclamações para expressar entonação dinâmica e acolhedora.
   - Intercale falas curtas e reativas da apresentadora enquanto o médico explica, dando sensação de estúdio e diálogo autêntico.

---

**ESTRUTURA SUGERIDA DO EPISÓDIO:**
1. **Abertura Calorosa:** ${SPEAKERS.HOST} recebe o paciente {{{patientName}}} pelo nome com muito carinho, criando um ambiente seguro e convidativo, e introduz o ${SPEAKERS.SPECIALIST}.
2. **Análise Profunda dos Exames:**
   - ${SPEAKERS.HOST} traz um resultado ou marcador específico.
   - ${SPEAKERS.SPECIALIST} explica o significado biológico daquele marcador (ex: colesterol, glicemia, hemograma, etc).
   - Se houver alterações, ${SPEAKERS.SPECIALIST} explica as **CAUSAS** possíveis (estilo de vida, genética, alimentação) e as soluções práticas.
3. **Educação sobre Condições e Mecanismos:**
   - Explica o que acontece no corpo de maneira clara e sem alarmismo.
4. **Tratamento e Hábitos (O "Como" e o "Porquê"):**
   - Ao discutir o plano de bem-estar, explica o **MECANISMO DE AÇÃO** (ex: como as fibras ajudam a 'varrer' o excesso de lipídios, como a água melhora a filtração renal, etc).
5. **Plano de Ação Prático:** ${SPEAKERS.HOST} recapitula os passos práticos da semana e lembra de compromissos agendados.
6. **Mensagem Final Inspiradora:** Encerramento motivador, reforçando a capacidade do paciente em transformar sua saúde dia a dia.

**REGRAS DE OURO PARA O CONTEÚDO:**
- **FRASES COMPLETAS:** Jamais deixe uma fala pela metade. Cada fala deve ter raciocínio completo com início, meio e fim.
- **ESTRUTURA COMPLETA:** O episódio OBRIGATORIAMENTE deve ter Início (boas-vindas), Meio (análise e explicações) e Fim (despedida e motivação).
- **SEJA CLARO E DIRETO:** Explique termos técnicos com exemplos simples do dia a dia.
- **TOM:** Profissional, caloroso, paciente e extremamente encorajador. Evite alarmismo, foque em soluções.
- **DURAÇÃO:** Gere um roteiro detalhado com aproximadamente **{{{targetLines}}} falas**.

**DADOS DO PACIENTE (USE ESTAS INFORMAÇÕES COMO BASE):**
- Paciente: {{{patientName}}}
- Resultados e Diagnósticos: {{{examContext}}}
- Plano de Bem-Estar e Tratamento: {{{wellnessContext}}}
- Próximas Consultas Agendadas: {{{agendaContext}}}

**IMPORTANTE:**
- NÃO invente medicamentos específicos que não estejam no contexto, mas pode citar classes gerais (ex: "estatinas", "anti-hipertensivos") como exemplo educativo, reforçando que o médico prescreve a melhor dosagem.
- Se o contexto for escasso, foque na educação sobre saúde preventiva baseada nos dados disponíveis.

Gere o roteiro como um array JSON válido.
`;

// --- PROMPT DO ROTEIRO ---
const podcastScriptPrompt = ai.definePrompt({
    name: "healthPodcastScriptPrompt",
    input: {
        schema: z.object({
            patientName: z.string(),
            examContext: z.string(),
            wellnessContext: z.string(),
            agendaContext: z.string().optional(),
            targetLines: z.number(),
        }),
    },
    output: {
        schema: PodcastScriptSchema,
    },
    prompt: PODCAST_PROMPT_TEMPLATE,
    model: "googleai/gemini-3.5-flash",
});

// --- GERAÇÃO DE ÁUDIO COM SUPORTE A FALLBACK E PACING ---
async function generateAudio(scriptItems: { speaker: string; text: string }[]): Promise<Buffer> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new PodcastGenerationError(
            "GEMINI_API_KEY não configurada",
            "MISSING_API_KEY",
            false
        );
    }

    let lastError: any;

    // 1. Agrupar falas consecutivas do mesmo speaker para otimizar chamadas
    // e aplicar limite seguro de tamanho por chunk (~1500 chars para reduzir requisições à API)
    const chunks: { speaker: string; text: string }[] = [];
    const MAX_CHUNK_LENGTH = 1500;

    let currentSpeaker = "";
    let currentBuffer = "";

    for (const item of scriptItems) {
        if (item.speaker !== currentSpeaker && currentSpeaker !== "") {
            if (currentBuffer.trim()) {
                chunks.push({ speaker: currentSpeaker, text: currentBuffer.trim() });
            }
            currentSpeaker = item.speaker;
            currentBuffer = item.text;
        } else if ((currentBuffer + " " + item.text).length > MAX_CHUNK_LENGTH) {
            if (currentBuffer.trim()) {
                chunks.push({ speaker: currentSpeaker, text: currentBuffer.trim() });
            }
            currentSpeaker = item.speaker;
            currentBuffer = item.text;
        } else {
            if (currentSpeaker === "") currentSpeaker = item.speaker;
            currentBuffer = currentBuffer ? currentBuffer + " " + item.text : item.text;
        }
    }
    if (currentBuffer.trim()) {
        chunks.push({ speaker: currentSpeaker || scriptItems[0]?.speaker || "Host", text: currentBuffer.trim() });
    }

    console.log(`[Health Podcast] Gerando áudio para ${chunks.length} blocos de fala agrupados.`);

    const audioBuffers: Buffer[] = [];
    const MAX_ATTEMPTS = 8;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        let chunkSuccess = false;

        // Definir voz baseada no speaker
        // Nathália (Host) -> Aoede (Feminina calorosa)
        // Dr. Daniel (Especialista) -> Puck (Masculina didática e encorpada)
        const speakerName = chunk.speaker.toLowerCase();
        const isFemale = speakerName.includes("nathália") || speakerName.includes("nathalia") || speakerName.includes("ana") || speakerName.includes("host");
        const voiceName = isFemale ? "Aoede" : "Puck";

        const modelsToTry = [TTS_CONFIG.primaryModel, ...TTS_CONFIG.fallbackModels];

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            const modelToUse = modelsToTry[(attempt - 1) % modelsToTry.length];

            try {
                // Pacing: pausa de 1200ms entre chunks para prevenir rate-limit HTTP 429
                if (i > 0 || attempt > 1) {
                    await new Promise(resolve => setTimeout(resolve, 1200));
                }

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`;

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "no-store",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: chunk.text }],
                            },
                        ],
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: voiceName },
                                },
                            },
                        },
                    }),
                    cache: "no-store",
                    signal: AbortSignal.timeout(90000), // 90s timeout por chunk
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Gemini API Error ${response.status} (${modelToUse}): ${errorText}`);
                }

                const data = await response.json();
                const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

                if (!inlineData?.data) {
                    throw new PodcastGenerationError(
                        "Nenhum áudio retornado pelo modelo Gemini",
                        "NO_AUDIO_DATA",
                        true
                    );
                }

                const rawAudio = Buffer.from(inlineData.data, "base64");
                audioBuffers.push(rawAudio);
                chunkSuccess = true;
                break; // Sucesso no chunk atual!

            } catch (error: any) {
                const msg = error.message || String(error);
                console.warn(`[Health Podcast] Bloco ${i + 1}/${chunks.length} (${chunk.speaker}) tentativa ${attempt} falhou:`, msg);

                if (msg.includes("403") || msg.includes("API_KEY_INVALID")) {
                    throw error; // Erros de chave inválida não adianta tentar novamente
                }

                // Fallback imediato para OpenRouter Audio API se disponível
                if (isOpenRouterConfigured()) {
                    try {
                        console.log(`[Health Podcast] 🔄 Acionando Fallback de Áudio via OpenRouter (openai/gpt-audio-mini) para bloco ${i + 1}/${chunks.length}...`);
                        const openRouterVoice = isFemale ? 'coral' : 'ash';
                        const openRouterAudio = await openRouterTextToSpeech({
                            text: chunk.text,
                            voice: openRouterVoice,
                            model: 'openai/gpt-audio-mini',
                        });
                        if (openRouterAudio && openRouterAudio.length > 0) {
                            audioBuffers.push(openRouterAudio);
                            chunkSuccess = true;
                            console.log(`[Health Podcast] ✅ Áudio do bloco ${i + 1} gerado com sucesso via OpenRouter (${openRouterVoice})!`);
                            break;
                        }
                    } catch (orAudioErr: any) {
                        console.warn(`[Health Podcast] Fallback OpenRouter áudio falhou:`, orAudioErr?.message || orAudioErr);
                    }
                }

                if (attempt < MAX_ATTEMPTS) {
                    const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded");
                    const is503 = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand");

                    let waitMs = 3000;
                    if (isRateLimit) {
                        // Extrai dinamicamente os segundos solicitados pelo Google (ex: 29s, 17s) ou aguarda 10s
                        let parsedDelay = 10000;
                        const retryMatch = msg.match(/retryDelay[^0-9]+(\d+)/i) || msg.match(/Please retry in\s+(\d+(?:\.\d+)?)/i);
                        if (retryMatch && retryMatch[1]) {
                            const sec = Math.ceil(parseFloat(retryMatch[1]));
                            if (!isNaN(sec) && sec > 0) {
                                parsedDelay = (sec + 2) * 1000;
                            }
                        }
                        waitMs = parsedDelay;
                        console.log(`[Health Podcast] ⏳ Cota temporária (429). Google solicitou espera de ${(waitMs / 1000).toFixed(0)}s. Aplicando Espera Inteligente antes de retentar bloco ${i + 1}/${chunks.length}...`);
                    } else if (is503) {
                        waitMs = 6000 + Math.floor(Math.random() * 3000); // 6s a 9s para 503
                        console.log(`[Health Podcast] ⏳ Servidor Google em alta demanda (503). Aguardando ${(waitMs / 1000).toFixed(0)}s antes de retentar bloco ${i + 1}/${chunks.length}...`);
                    } else {
                        waitMs = Math.min(10000, 2000 * Math.pow(2, attempt - 1));
                        console.log(`[Health Podcast] ⏳ Aguardando ${(waitMs / 1000).toFixed(0)}s antes de retentar bloco ${i + 1}...`);
                    }

                    await new Promise(resolve => setTimeout(resolve, waitMs));
                } else {
                    lastError = error;
                }
            }
        }

        if (!chunkSuccess) {
            throw lastError || new Error(`Falha definitiva ao gerar áudio para o bloco ${i + 1}`);
        }
    }

    // Concatenar todos os buffers PCM gerados
    const totalRawAudio = Buffer.concat(audioBuffers);
    const wavHeader = createWavHeader(totalRawAudio.length, TTS_CONFIG);

    return Buffer.concat([wavHeader, totalRawAudio]);
}

// --- FLUXO PRINCIPAL ---
const healthPodcastFlow = ai.defineFlow(
    {
        name: "healthPodcastFlow",
        inputSchema: HealthPodcastInputSchema,
        outputSchema: HealthPodcastOutputSchema,
    },
    async (input): Promise<HealthPodcastOutput> => {
        const startTime = Date.now();
        const t0 = Date.now();

        // 1. Obter contexto
        const tContextStart = Date.now();
        const context = await getPatientContext(input.patientId);
        const contextMs = Date.now() - tContextStart;

        // 2. Gerar Roteiro com Retry e Resiliência (prevenção contra 503 / picos de tráfego) e Fallback para OpenRouter
        const tScriptStart = Date.now();
        let output: any = null;
        let usedScriptModel = "gemini-3.5-flash";
        const maxScriptAttempts = 3;
        for (let attempt = 1; attempt <= maxScriptAttempts; attempt++) {
            try {
                const response = await podcastScriptPrompt({
                    patientName: context.patientName,
                    examContext: context.examContext,
                    wellnessContext: context.wellnessContext,
                    agendaContext: context.agendaContext,
                    targetLines: context.targetLines,
                });
                output = response.output;
                if (output?.script && output.script.length >= 5) {
                    usedScriptModel = "gemini-3.5-flash";
                    break;
                }
            } catch (err: any) {
                console.warn(`[Health Podcast] Tentativa ${attempt} de roteiro falhou:`, err?.message || err);

                // Fallback automático para OpenRouter se configurado
                if (isOpenRouterConfigured()) {
                    try {
                        console.log(`[Health Podcast] 🔄 Acionando Fallback para OpenRouter (DeepSeek / Claude)...`);
                        const fallbackPrompt = `
Você é o roteirista do Podcast MediAI.
Nome do paciente: ${context.patientName}
Contexto dos exames: ${context.examContext}
Contexto de estilo de vida e bem-estar: ${context.wellnessContext}
Agenda / Próximas consultas: ${context.agendaContext}
Meta de falas: ~${context.targetLines} turnos de conversa.

Gere um roteiro estruturado com duas vozes: "Nathália" (Apresentadora calorosa) e "Dr. Daniel" (Médico especialista didático).
Retorne em formato JSON no schema:
{
  "episodeTitle": string,
  "theme": string,
  "overview": string,
  "script": [
     { "speaker": "Nathália" | "Dr. Daniel", "text": string }
  ],
  "practicalTips": string[]
}
`;
                        const openRouterRes = await openRouterGenerateStructured<{
                            episodeTitle: string;
                            theme: string;
                            overview: string;
                            script: Array<{ speaker: string; text: string }>;
                            practicalTips: string[];
                        }>({
                            prompt: fallbackPrompt,
                            systemPrompt: PODCAST_PROMPT_TEMPLATE,
                            model: process.env.OPENROUTER_DEFAULT_MODEL || "deepseek/deepseek-chat",
                        });

                        if (openRouterRes.data?.script && openRouterRes.data.script.length >= 5) {
                            output = openRouterRes.data;
                            usedScriptModel = openRouterRes.model;
                            console.log(`[Health Podcast] ✅ Roteiro gerado com sucesso via OpenRouter (${usedScriptModel})!`);
                            break;
                        }
                    } catch (openRouterErr: any) {
                        console.warn(`[Health Podcast] Fallback OpenRouter falhou:`, openRouterErr?.message || openRouterErr);
                    }
                }

                if (attempt < maxScriptAttempts) {
                    const delay = 1500 * attempt;
                    await new Promise(r => setTimeout(r, delay));
                } else if (!output?.script) {
                    throw err;
                }
            }
        }
        const scriptMs = Date.now() - tScriptStart;

        // Rastrear uso do LLM (Script)
        const scriptInputText = JSON.stringify({
            patientName: context.patientName,
            examContext: context.examContext,
            wellnessContext: context.wellnessContext,
            agendaContext: context.agendaContext,
            targetLines: context.targetLines,
        });
        const scriptOutputText = JSON.stringify(output?.script || []);

        const promptTokens = countTextTokens(PODCAST_PROMPT_TEMPLATE);
        const contextTokens = countTextTokens(scriptInputText);
        const totalInputTokens = promptTokens + contextTokens;
        const outputTokens = countTextTokens(scriptOutputText);

        trackAIUsage({
            patientId: input.patientId,
            usageType: "podcast_script",
            model: usedScriptModel,
            inputTokens: totalInputTokens,
            outputTokens,
            metadata: {
                feature: "health-podcast-script",
                durationMs: Date.now() - startTime, // Aproximado
                dataFetchSize: scriptInputText.length,
                promptTemplateSize: PODCAST_PROMPT_TEMPLATE.length,
                promptTokens,
                contextTokens,
                totalInputTokens,
                totalOutputTokens: outputTokens,
            },
        }).catch((err) => console.error("[Health Podcast] Script tracking error:", err));

        if (!output?.script || output.script.length < 5) {
            throw new PodcastGenerationError(
                "Roteiro muito curto ou vazio retornado pelo modelo",
                "INVALID_SCRIPT_LENGTH",
                true
            );
        }

        // 3. Preparar texto formatado
        const minLines = Math.max(5, Math.floor(context.targetLines * 0.5));
        // Aumentar margem de segurança para garantir que o final não seja cortado
        const maxLines = Math.ceil(context.targetLines * 1.2) + 5;
        // Aumentado significativamente para evitar cortes em explicações médicas
        const maxLineChars = 1000;

        const cleanedScript = output.script.map((s) => ({
            speaker: s.speaker,
            text: s.text.replace(/\s+/g, " ").trim(),
        }));

        const limitedScript = cleanedScript.slice(0, maxLines).map((s) => ({
            speaker: s.speaker,
            // Usar truncate apenas como safeguard extremo, não como regra de formatação
            text: truncateText(s.text, maxLineChars),
        }));

        if (limitedScript.length < minLines) {
            throw new PodcastGenerationError(
                "Roteiro insuficiente retornado pelo modelo",
                "INSUFFICIENT_SCRIPT",
                true
            );
        }

        const dialogText = limitedScript
            .map((s) => `${s.speaker}: ${s.text}`)
            .join("\n\n");

        // 4. Gerar Áudio
        const tAudioStart = Date.now();
        const audioBuffer = await generateAudio(limitedScript);
        const audioMs = Date.now() - tAudioStart;

        // 5. Salvar em Storage (Vercel Blob ou Local)
        // Usar .wav pois generateAudio retorna WAV
        const tUploadStart = Date.now();
        const audioUrl = await saveFileBuffer(audioBuffer, "podcast.wav", "podcasts");
        const uploadMs = Date.now() - tUploadStart;

        // 6. Estimar duração (aproximada)
        const audioDataSize = audioBuffer.length - 44; // Remove header
        const bytesPerSecond =
            TTS_CONFIG.sampleRate * TTS_CONFIG.numChannels * (TTS_CONFIG.bitsPerSample / 8);
        const durationEstimate = Math.round(audioDataSize / bytesPerSecond);

        // 7. Salvar no banco (em background) - REMOVIDO pois agora é gerenciado pelo wrapper
        /*
        savePodcastToDatabase(input.patientId, audioUrl, dialogText).catch((err) =>
            console.error("[Health Podcast] Erro ao salvar no BD:", err)
        );
        */

        // 8. Rastrear uso (em background)
        // Estimar tokens de áudio (180 tokens/segundo para Gemini Native Audio)
        const estimatedAudioTokens = Math.ceil(durationEstimate * 180);

        trackAIUsage({
            patientId: input.patientId,
            usageType: "tts",
            model: TTS_CONFIG.primaryModel,
            inputTokens: countTextTokens(dialogText),
            outputTokens: estimatedAudioTokens,
            metadata: {
                feature: "health-podcast-audio",
                durationMs: Date.now() - startTime,
                audioSizeBytes: audioBuffer.length,
                audioDurationSeconds: durationEstimate,
                stepTimingsMs: {
                    contextMs,
                    scriptMs,
                    audioMs,
                    uploadMs,
                    totalMs: Date.now() - t0,
                },
            },
        }).catch((err) => console.error("[Health Podcast] Audio tracking error:", err));

        console.log(`[Health Podcast] timings: context=${contextMs}ms script=${scriptMs}ms audio=${audioMs}ms upload=${uploadMs}ms total=${Date.now() - t0}ms`);

        return {
            audioUrl,
            transcript: dialogText,
            durationEstimate,
        };
    }
);

// --- FUNÇÕES AUXILIARES DE BANCO ---

async function createInitialPodcastRecord(id: string, patientId: string) {
    const latestExam = await db
        .select({ id: exams.id, date: exams.date })
        .from(exams)
        .where(eq(exams.patientId, patientId))
        .orderBy(desc(exams.createdAt))
        .limit(1);

    await db.insert(healthPodcasts).values({
        id,
        patientId,
        audioUrl: "", // Placeholder
        transcript: "", // Placeholder
        lastExamId: latestExam[0]?.id || null,
        lastExamDate: latestExam[0]?.date || null,
        status: 'processing',
        generatedAt: new Date(),
    });
}

async function completePodcastRecord(id: string, audioUrl: string, transcript: string) {
    await db.update(healthPodcasts)
        .set({ audioUrl, transcript, status: 'completed' })
        .where(eq(healthPodcasts.id, id));
}

async function failPodcastRecord(id: string) {
    await db.update(healthPodcasts)
        .set({ status: 'failed' })
        .where(eq(healthPodcasts.id, id));
}

/*
async function savePodcastToDatabase(
    patientId: string,
    audioUrl: string,
    transcript: string
): Promise<void> {
    const latestExam = await db
        .select({ id: exams.id, date: exams.date })
        .from(exams)
        .where(eq(exams.patientId, patientId))
        .orderBy(desc(exams.createdAt))
        .limit(1);

    await db.insert(healthPodcasts).values({
        id: randomUUID(),
        patientId,
        audioUrl, // ⚠️ Em produção, salvar em storage externo e armazenar apenas a URL
        transcript,
        lastExamId: latestExam[0]?.id || null,
        lastExamDate: latestExam[0]?.date || null,
        generatedAt: new Date(),
    });

    console.log(`[Health Podcast] Podcast salvo para paciente ${patientId}`);
}
*/

function estimateTokenCount(text: string): number {
    // Aproximação mais precisa para português (~3.5 chars/token)
    return Math.ceil(text.length / 3.5);
}

function truncateText(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trimEnd() + "…";
}

interface WavHeaderOptions {
    numChannels: number;
    sampleRate: number;
    bitsPerSample: number;
}

function createWavHeader(dataLength: number, options: WavHeaderOptions): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;

    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = Buffer.alloc(44);

    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM format
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
}
