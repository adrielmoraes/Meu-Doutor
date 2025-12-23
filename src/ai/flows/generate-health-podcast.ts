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
import { GoogleGenAI } from "@google/genai";
import { db } from "@/server/storage";
import { healthPodcasts, exams } from "@/shared/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { saveFileBuffer } from "@/lib/file-storage";


// --- CONSTANTES ---
const SPEAKERS = {
    HOST: "Nathalia",
    SPECIALIST: "Dr. Daniel",
} as const;

const TTS_CONFIG = {
    model: "gemini-2.5-flash-preview-tts",
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
    text: z.string().min(1),
});

const PodcastScriptSchema = z.object({
    script: z.array(ScriptLineSchema).min(12).max(24),
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
): Promise<HealthPodcastOutput> {
    // Validação de entrada
    const validatedInput = HealthPodcastInputSchema.safeParse(input);
    if (!validatedInput.success) {
        throw new PodcastGenerationError(
            `Entrada inválida: ${validatedInput.error.message}`,
            "INVALID_INPUT",
            false
        );
    }

    return healthPodcastFlow(validatedInput.data);
}

// --- CONTEXTO DO PACIENTE (OTIMIZADO) ---
async function getPatientContext(patientId: string) {
    // Execução paralela
    const [patient, examsData] = await Promise.all([
        getPatientById(patientId),
        getRecentExamsForPodcast(patientId, 5),
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
                    `Exame: ${e.type} (${e.date ? new Date(e.date).toLocaleDateString("pt-BR") : "Sem data"})\nResultado: ${truncateText((e.preliminaryDiagnosis || e.result || "Sem análise").toString(), 450)}`
            )
            .join("\n\n")
        : "Nenhum exame registrado recentemente.";

    const wellnessContext = patient.wellnessPlan?.dietaryPlan
        ? `Plano de Bem-Estar: ${truncateText(patient.wellnessPlan.dietaryPlan, 450)}`
        : "Sem plano de bem-estar no momento.";

    return {
        patientName: patient.name,
        examContext: truncateText(examContext, 1400),
        wellnessContext: truncateText(wellnessContext, 900),
        patientId,
    };
}

const PODCAST_PROMPT_TEMPLATE = `
**SUA MISSÃO:** Criar o roteiro para um episódio do "Podcast MediAI", um programa educacional e personalizado que explica a saúde do paciente de forma clara, didática e acolhedora.

**PERSONAGENS (USE EXATAMENTE ESTES NOMES):**
1. **${SPEAKERS.HOST}** (Apresentadora): Curiosa, empática e organizada. Ela representa a voz do paciente, fazendo perguntas fundamentais que ele provavelmente teria. Ela garante que nenhum termo técnico fique sem explicação.
2. **${SPEAKERS.SPECIALIST}** (Especialista Convidado): Uma autoridade médica renomada, mas com uma didática excepcional. Ele não apenas informa, ele *ensina*. Ele detalha mecanismos das doenças, o "porquê" dos tratamentos e como os medicamentos agem no corpo.

**ESTRUTURA SUGERIDA (ADAPTAR CONFORME NECESSÁRIO):**
1. **Abertura Calorosa:** ${SPEAKERS.HOST} recebe o paciente {{{patientName}}} pelo nome, criando um ambiente seguro, e introduz o ${SPEAKERS.SPECIALIST} com credibilidade.
2. **Análise Profunda dos Exames:**
   - ${SPEAKERS.HOST} traz um resultado específico.
   - ${SPEAKERS.SPECIALIST} explica o que aquele marcador significa biologicamente (ex: "O colesterol não é apenas gordura, é...").
   - Se houver alterações, ${SPEAKERS.SPECIALIST} explica as **CAUSAS** possíveis (estilo de vida, genética, etc) e as consequências se não tratado.
3. **Educação sobre Condições/Doenças:**
   - Se houver diagnóstico ou risco, dedique tempo para explicar a doença. O que acontece no corpo? Quais os sintomas silenciosos?
4. **Tratamento e Medicamentos (O "Como" e o "Porquê"):**
   - Ao discutir o plano de bem-estar, não liste apenas tarefas.
   - ${SPEAKERS.SPECIALIST} deve explicar o **MECANISMO DE AÇÃO**. Ex: "Este medicamento ajuda a relaxar os vasos sanguíneos..." ou "Comer fibras ajuda a 'varrer' o colesterol...".
   - Detalhe tipos de tratamento (mudanças de hábito vs. medicamentoso).
5. **Plano de Ação Prático:** ${SPEAKERS.HOST} recapitula os passos práticos do dia a dia.
6. **Mensagem Final Inspiradora:** Encerramento motivacional focado na capacidade do paciente de melhorar sua saúde.

**REGRAS DE OURO PARA O CONTEÚDO:**
- **SEJA CLARO E DIRETO:** Explique termos técnicos com exemplos simples.
- **EXPLIQUE CAUSAS E EFEITOS:** Conecte os pontos para o paciente. "Isso acontece porque..." -> "Isso pode levar a...".
- **TRATAMENTOS:** Se houver menção a medicamentos ou terapias no contexto, explique como eles funcionam. Se for mudança de estilo de vida, explique a biologia por trás da mudança (ex: como o exercício baixa a glicose).
- **TOM:** Profissional, mas extremamente humano, paciente e encorajador. Evite alarmismo, foque em soluções.
- **FALAS CURTAS:** Cada fala deve ter no máximo **1 a 2 frases curtas**.
- **DURAÇÃO:** Gere um roteiro objetivo, entre **12 e 14 falas**.

**DADOS DO PACIENTE (USE ESTAS INFORMAÇÕES COMO BASE):**
- Paciente: {{{patientName}}}
- Resultados e Diagnósticos: {{{examContext}}}
- Plano de Bem-Estar e Tratamento: {{{wellnessContext}}}

**IMPORTANTE:**
- NÃO invente medicamentos específicos que não estejam no contexto, mas pode falar sobre *classes* de medicamentos se apropriado para a condição (ex: "estatinas" para colesterol) como exemplo educativo, deixando claro que o médico prescreve o melhor.
- Se o contexto for escasso, foque na educação sobre saúde preventiva baseada nos dados disponíveis.

Gere o roteiro como um array JSON válido.
`;

// --- PROMPT DO ROTEIRO (CORRIGIDO) ---
const podcastScriptPrompt = ai.definePrompt({
    name: "healthPodcastScriptPrompt",
    input: {
        schema: z.object({
            patientName: z.string(),
            examContext: z.string(),
            wellnessContext: z.string(),
        }),
    },
    output: {
        schema: PodcastScriptSchema,
    },
    prompt: PODCAST_PROMPT_TEMPLATE,
    model: "googleai/gemini-2.5-flash",
});

// --- GERAÇÃO DE ÁUDIO ---
async function generateAudio(dialogText: string): Promise<Buffer> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new PodcastGenerationError(
            "GEMINI_API_KEY não configurada",
            "MISSING_API_KEY",
            false
        );
    }

    const genAI = new GoogleGenAI({ apiKey });

    try {
        const responseStream = await genAI.models.generateContentStream({
            model: TTS_CONFIG.model,
            contents: [
                {
                    role: "user",
                    parts: [{ text: dialogText }],
                },
            ],
            config: {
                responseModalities: ["audio"],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: SPEAKERS.SPECIALIST, // ✅ Corrigido
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: "Fenrir" },
                                },
                            },
                            {
                                speaker: SPEAKERS.HOST, // ✅ Corrigido
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: "Aoede" },
                                },
                            },
                        ],
                    },
                },
            },
        });

        const pcmChunks: Buffer[] = [];

        for await (const chunk of responseStream) {
            const inlineData = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            if (inlineData?.data) {
                pcmChunks.push(Buffer.from(inlineData.data, "base64"));
            }
        }

        if (pcmChunks.length === 0) {
            throw new PodcastGenerationError(
                "Nenhum áudio retornado pelo modelo",
                "NO_AUDIO_DATA",
                true
            );
        }

        const rawAudio = Buffer.concat(pcmChunks);
        const wavHeader = createWavHeader(rawAudio.length, TTS_CONFIG);

        return Buffer.concat([wavHeader, rawAudio]);
    } catch (error) {
        if (error instanceof PodcastGenerationError) throw error;

        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("403") || errorMessage.includes("API_KEY_SERVICE_BLOCKED")) {
            throw new PodcastGenerationError(
                "API do Google Cloud não habilitada ou bloqueada",
                "API_BLOCKED",
                false
            );
        }
        if (errorMessage.includes("404")) {
            throw new PodcastGenerationError(
                `Modelo '${TTS_CONFIG.model}' não encontrado`,
                "MODEL_NOT_FOUND",
                false
            );
        }
        if (errorMessage.includes("400") || errorMessage.includes("INVALID_ARGUMENT")) {
            throw new PodcastGenerationError(
                "Parâmetros inválidos enviados ao Gemini",
                "INVALID_PARAMS",
                false
            );
        }
        if (errorMessage.includes("429")) {
            throw new PodcastGenerationError(
                "Limite de requisições excedido",
                "RATE_LIMITED",
                true
            );
        }

        throw new PodcastGenerationError(
            `Falha na geração de áudio: ${errorMessage}`,
            "AUDIO_GENERATION_FAILED",
            true
        );
    }
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

        // 2. Gerar Roteiro
        const tScriptStart = Date.now();
        const { output } = await podcastScriptPrompt({
            patientName: context.patientName,
            examContext: context.examContext,
            wellnessContext: context.wellnessContext,
        });
        const scriptMs = Date.now() - tScriptStart;

        // Rastrear uso do LLM (Script)
        const scriptInputText = JSON.stringify({
            patientName: context.patientName,
            examContext: context.examContext,
            wellnessContext: context.wellnessContext,
        });
        const scriptOutputText = JSON.stringify(output?.script || []);
        
        const promptTokens = countTextTokens(PODCAST_PROMPT_TEMPLATE);
        const contextTokens = countTextTokens(scriptInputText);
        const totalInputTokens = promptTokens + contextTokens;
        const outputTokens = countTextTokens(scriptOutputText);

        trackAIUsage({
            patientId: input.patientId,
            usageType: "podcast_script",
            model: "gemini-2.5-flash",
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

        if (!output?.script || output.script.length === 0) {
            throw new PodcastGenerationError(
                "Roteiro vazio retornado pelo modelo",
                "EMPTY_SCRIPT",
                true
            );
        }

        // 3. Preparar texto formatado
        const minLines = 12;
        const maxLines = 14;
        const maxLineChars = 170;

        const cleanedScript = output.script.map((s) => ({
            speaker: s.speaker,
            text: s.text.replace(/\s+/g, " ").trim(),
        }));

        const limitedScript = cleanedScript.slice(0, maxLines).map((s) => ({
            speaker: s.speaker,
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
            .slice(0, minLines)
            .map((s) => `${s.speaker}: ${s.text}`)
            .join("\n\n");

        // 4. Gerar Áudio
        const tAudioStart = Date.now();
        const audioBuffer = await generateAudio(dialogText);
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

        // 7. Salvar no banco (em background)
        savePodcastToDatabase(input.patientId, audioUrl, dialogText).catch((err) =>
            console.error("[Health Podcast] Erro ao salvar no BD:", err)
        );

        // 8. Rastrear uso (em background)
        // Estimar tokens de áudio (180 tokens/segundo para Gemini Native Audio)
        const estimatedAudioTokens = Math.ceil(durationEstimate * 180);

        trackAIUsage({
            patientId: input.patientId,
            usageType: "tts",
            model: TTS_CONFIG.model,
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

// --- FUNÇÕES AUXILIARES ---

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
