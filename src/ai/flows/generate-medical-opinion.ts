'use server';
/**
 * @fileOverview AI flow for generating a Medical Opinion (Parecer Médico) using
 * EXISTING exam data. Supports two scopes:
 *   - 'specific': Focused analysis on a single exam only (fast, targeted)
 *   - 'global':   Comprehensive analysis across all patient exams (broader synthesis)
 *
 * This does NOT re-run the full multi-specialist pipeline.
 * Instead, it takes the already-saved specialist findings and runs ONLY the
 * synthesis step, saving ~98% of time and ~80% of cost.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { countTextTokens } from '@/lib/token-counter';
import { trackAIUsage } from '@/lib/usage-tracker';
import { generateWithFallback } from '@/lib/ai-resilience';

// --- Input/Output Schemas ---

const GenerateMedicalOpinionInputSchema = z.object({
    patientId: z.string().describe('The ID of the patient.'),
    patientName: z.string().optional().describe('Full name of the patient.'),
    patientAge: z.number().optional().describe('Age of the patient in years.'),
    patientGender: z.string().optional().describe('Gender of the patient.'),
    patientIMC: z.string().optional().describe('IMC/BMI data string (weight, height, classification).'),
    patientSymptoms: z.string().optional().describe('Current symptoms/complaints reported by the patient.'),
    doctorName: z.string().optional().describe('Full name of the doctor signing the opinion.'),
    doctorCrm: z.string().optional().describe('CRM registration number of the doctor.'),
    doctorSpecialty: z.string().optional().describe('Medical specialty of the doctor.'),
    currentDate: z.string().optional().describe('The current date in DD/MM/AAAA format.'),
    currentTime: z.string().optional().describe('The current time in HH:mm format (Brasília time).'),
    patientHistory: z.string().optional().describe('Summary of patient history (used primarily in global scope).'),
    examType: z.string().optional().describe('The type/name of the current exam being analyzed.'),
    examResults: z.string().describe('The raw exam results text or preliminary diagnosis.'),
    analysisScope: z.enum(['specific', 'global']).default('specific').describe('Whether to generate a focused or comprehensive opinion.'),
    specialistFindings: z.array(z.object({
        specialist: z.string(),
        findings: z.string(),
        clinicalAssessment: z.string(),
        recommendations: z.union([z.string(), z.array(z.string())]),
    })).optional().describe('Pre-existing specialist findings from the exam analysis.'),
});

export type GenerateMedicalOpinionInput = z.infer<typeof GenerateMedicalOpinionInputSchema>;

const GenerateMedicalOpinionOutputSchema = z.object({
    synthesis: z.string().describe('The final medical opinion synthesis.'),
    suggestions: z.string().describe('Suggested next steps and conduct plan.'),
});

export type GenerateMedicalOpinionOutput = z.infer<typeof GenerateMedicalOpinionOutputSchema>;

// --- Prompt for SPECIFIC exam (focused, complete, professional) ---

const SPECIFIC_EXAM_PROMPT = `Você é um médico especialista sênior. Gere um PARECER MÉDICO COMPLETO e PROFISSIONAL sobre UM ÚNICO exame clínico — um documento formal que o médico assistente poderá revisar, editar e assinar.

EXAME: {{{examType}}}

PACIENTE:
- Nome: {{patientName}}
- Idade: {{patientAge}} anos
- Sexo: {{patientGender}}

{{#if patientIMC}}
DADOS ANTROPOMÉTRICOS DO PACIENTE:
{{{patientIMC}}}
{{/if}}

{{#if patientSymptoms}}
QUEIXAS ATUAIS RELATADAS PELO PACIENTE:
{{{patientSymptoms}}}
IMPORTANTE: Considere as queixas relatadas pelo paciente ao elaborar a impressão diagnóstica e as recomendações. Correlacione sintomas com achados nos exames quando aplicável.
{{/if}}

MÉDICO RESPONSÁVEL:
- Nome: {{doctorName}}
- CRM: {{doctorCrm}}
- Especialidade: {{doctorSpecialty}}

DATA/HORA ATUAL (BRASÍLIA):
- Data: {{currentDate}}
- Hora: {{currentTime}}

RESULTADOS DO EXAME:
{{{examResults}}}

{{#if patientHistory}}
CONTEXTO CLÍNICO ADICIONAL (outros exames e histórico):
{{{patientHistory}}}

IMPORTANTE: Use este contexto para CORRELACIONAR achados entre exames. Se um exame anterior mostra resultados relevantes para o exame atual, MENCIONE a correlação na impressão diagnóstica.
{{/if}}

{{#if specialistReports.length}}
PARECERES DOS ESPECIALISTAS:
{{#each specialistReports}}
---
ESPECIALISTA: {{specialist}}
Achados: {{{findings}}}
Avaliação: {{clinicalAssessment}}
Recomendações: {{{recommendations}}}
---
{{/each}}
{{/if}}

INSTRUÇÕES DE FORMATAÇÃO — OBRIGATÓRIAS:

1. CAMPO "synthesis" — LAUDO TÉCNICO:

Gere o documento EXATAMENTE neste formato (texto puro, sem asteriscos, sem hashtags, sem emojis):

========================================
PLATAFORMA MEDI.AI — PARECER MÉDICO
========================================
Data de Emissão: {{currentDate}} às {{currentTime}} (Horário de Brasília)
Médico Responsável: {{doctorName}}
CRM: {{doctorCrm}}
Especialidade: {{doctorSpecialty}}
----------------------------------------
PACIENTE: {{patientName}}
Idade: {{patientAge}} anos
Sexo: {{patientGender}}
========================================

LAUDO: [Nome Completo do Exame]

CONCLUSÃO GERAL: [Normal / Discretamente Alterado / Alterado / Significativamente Alterado / Crítico]

VALORES ALTERADOS:
Para cada achado fora da normalidade, use este formato (um por linha):
- [ALERTA] [Parâmetro]: [Valor encontrado] (Ref: [faixa normal]) — [Interpretação clínica objetiva]

Se requer ação imediata:
- [CRÍTICO] [Parâmetro]: [Valor encontrado] (Ref: [faixa normal]) — [Interpretação e urgência]

VALORES NORMAIS RELEVANTES:
Normais: [Parâmetro1], [Parâmetro2], [Parâmetro3]

IMPRESSÃO DIAGNÓSTICA:
1. [Diagnóstico principal] — [Fundamentação baseada nos achados]
2. [Diagnóstico diferencial] — [Por que deve ser considerado]
3. [Diagnóstico adicional] — [Se aplicável]

---

2. CAMPO "suggestions" — PLANO TERAPÊUTICO E CONDUTA:

(Texto puro, sem Markdown)

TRATAMENTO FARMACOLÓGICO PROPOSTO:

Classe do Medicamento 1: [Ex: Corticosteroide Nasal / Anti-histamínico / IECA]
- Medicamento: [Nome genérico (nome comercial)]
- Posologia: [dose, frequência e via de administração]
- Duração: [prazo ou critério de continuidade]
- Objetivo: [desfecho esperado com este medicamento]

Classe do Medicamento 2: [Se aplicável]
- Medicamento: [Nome genérico (nome comercial)]
- Posologia: [dose, frequência e via de administração]
- Duração: [prazo]
- Objetivo: [benefício esperado]

MEDIDAS NÃO FARMACOLÓGICAS:
- [Medida 1]: [Instrução objetiva para o paciente]
- [Medida 2]: [Ex: higiene nasal, controle ambiental, dieta, exercício]

CONDUTAS E ENCAMINHAMENTOS:
- [Ação clínica 1] — [Fundamentação ou diretriz]
- [Especialidade]: [Motivo e urgência — imediato / eletivo / rotina]

EXAMES COMPLEMENTARES RECOMENDADOS:
- [Exame]: [Justificativa e prazo sugerido]

CRITÉRIOS PARA ESCALONAMENTO / CIRURGIA:
- [Condição]: [Quando indicar abordagem mais invasiva]
(Omita se não aplicável ao caso)

RETORNO E ACOMPANHAMENTO:
- Retorno em [prazo] para [objetivo da consulta de retorno]
- Reavaliar [parâmetro/exame] em [prazo]
- Critérios de melhora esperados: [o que monitorar]
- Sinais de alerta para retorno imediato: [sintomas que exigem reavaliação urgente]

---

REGRAS ABSOLUTAS:
- Português Brasileiro. Sem emojis. Sem asteriscos (**) ou hashtags (###).
- Texto 100% limpo: letras maiúsculas para seções, traços para listas.
- Use DUAS QUEBRAS DE LINHA (Enter duas vezes) entre cada seção principal (LAUDO, CONCLUSÃO, etc.).
- Marque obrigatoriamente [ALERTA] ou [CRÍTICO] em cada achado alterado.
- Para medicamentos: nome genérico + posologia completa (dose + frequência + via) + duração.
- Cite diretrizes (SBC, SBO, ARIA, AHA, ADA, NICE, etc.) quando aplicável.
- O cabeçalho com MEDI.AI, nome do médico, CRM, e dados do paciente é OBRIGATÓRIO.`;

// --- Prompt for GLOBAL analysis (comprehensive, integrated) ---

const GLOBAL_ANALYSIS_PROMPT = `Você é o Dr. Márcio Silva, Clínico Geral e Coordenador Médico Sênior em IA.

Sua Missão: Criar uma SÍNTESE CLÍNICA GLOBAL completa do paciente, integrando os achados de MÚLTIPLOS exames e propondo um plano de tratamento integrado e coerente — um documento formal que o médico assistente poderá revisar, editar e assinar.

PACIENTE:
- Nome: {{patientName}}
- Idade: {{patientAge}} anos
- Sexo: {{patientGender}}

MÉDICO RESPONSÁVEL:
- Nome: {{doctorName}}
- CRM: {{doctorCrm}}
- Especialidade: {{doctorSpecialty}}

DATA/HORA ATUAL (BRASÍLIA):
- Data: {{currentDate}}
- Hora: {{currentTime}}

HISTÓRICO DO PACIENTE:
{{{patientHistory}}}

RESULTADOS CONSOLIDADOS DE TODOS OS EXAMES:
{{{examResults}}}

{{#if specialistReports.length}}
PARECERES DOS ESPECIALISTAS (todos os exames):
{{#each specialistReports}}
---
ESPECIALISTA: {{specialist}}
Achados: {{{findings}}}
Avaliação: {{clinicalAssessment}}
Recomendações: {{{recommendations}}}
---
{{/each}}
{{/if}}

INSTRUÇÕES DE FORMATAÇÃO — OBRIGATÓRIAS:

1. CAMPO "synthesis" — LAUDO CLÍNICO GLOBAL:

Gere o documento EXATAMENTE neste formato (texto puro, sem asteriscos, sem hashtags, sem emojis):

========================================
PLATAFORMA MEDI.AI — PARECER MÉDICO GLOBAL
========================================
Data de Emissão: {{currentDate}} às {{currentTime}} (Horário de Brasília)
Médico Responsável: {{doctorName}}
CRM: {{doctorCrm}}
Especialidade: {{doctorSpecialty}}
----------------------------------------
PACIENTE: {{patientName}}
Idade: {{patientAge}} anos
Sexo: {{patientGender}}
========================================

SÍNTESE CLÍNICA GLOBAL

PERFIL DO PACIENTE: [Nome, idade, sexo, principais condições e contexto clínico em 1-2 linhas]

ACHADOS CRÍTICOS (AÇÃO IMEDIATA):
- [CRÍTICO] [Achado]: [Valor] — [Ação imediata recomendada]
(Se não houver: Nenhum achado crítico identificado nesta revisão.)

ACHADOS ALTERADOS (MONITORAMENTO):
- [ALERTA] [Achado]: [Valor] — [Significado clínico e relevância]

CORRELAÇÕES ENTRE EXAMES:
- [Conexão clínica entre dois ou mais exames e o que ela significa clinicamente]
- [Outra correlação relevante]

IMPRESSÃO DIAGNÓSTICA INTEGRADA:
1. [Diagnóstico principal] — [Sustentado por quais exames/achados]
2. [Condição associada] — [Relação com diagnóstico principal]
3. [Diagnóstico diferencial ou secundário] — [Se aplicável]

---

2. CAMPO "suggestions" — PLANO TERAPÊUTICO INTEGRADO:

(Texto puro, sem Markdown)

TRATAMENTO FARMACOLÓGICO INTEGRADO:
(Organize por prioridade clínica — trate primeiro o que é mais urgente)

Condição 1: [Nome da condição mais urgente]
  Classe: [Classe farmacológica indicada]
  - Medicamento: [Nome genérico (nome comercial)]
  - Posologia: [dose, frequência, via de administração]
  - Duração: [prazo ou critério de continuidade]
  - Objetivo: [desfecho esperado]

Condição 2: [Nome da próxima condição]
  Classe: [Classe farmacológica indicada]
  - Medicamento: [Nome genérico (nome comercial)]
  - Posologia: [dose, frequência, via de administração]
  - Duração: [prazo]
  - Objetivo: [desfecho esperado]

[Repita para todas as condições que necessitam de farmacoterapia]

INTERAÇÕES MEDICAMENTOSAS A MONITORAR:
- [Medicamento A] + [Medicamento B]: [Risco e como monitorar]
(Se não houver: Não foram identificadas interações clinicamente relevantes entre os medicamentos propostos.)

MEDIDAS NÃO FARMACOLÓGICAS:
- [Medida 1]: [Instrução objetiva]
- [Medida 2]: [Ex: dieta, exercício, higiene do sono, controle ambiental]

ENCAMINHAMENTOS PRIORITÁRIOS:
- [Especialidade 1] — [Motivo e urgência: imediato / eletivo / rotina]
- [Especialidade 2] — [Motivo]

EXAMES COMPLEMENTARES RECOMENDADOS:
- [Exame]: [Justificativa e prazo para realização]
- [Exame 2]: [Justificativa]

ACOMPANHAMENTO E RETORNO:
- Retorno em [prazo] para [objetivo da consulta de retorno]
- Reavaliar [exame/parâmetro] em [prazo]
- Metas terapêuticas: [valores-alvo esperados para os parâmetros mais importantes]
- Sinais de alerta para retorno imediato: [sintomas que exigem reavaliação urgente]

---

REGRAS ABSOLUTAS:
- Português Brasileiro. Sem emojis. Sem asteriscos ou hashtags.
- Formato de tópicos, não parágrafos.
- Use DUAS QUEBRAS DE LINHA (Enter duas vezes) entre cada seção principal (SÍNTESE, ACHADOS, etc.).
- Para medicamentos: nome genérico + posologia completa (dose + frequência + via) + duração.
- Marque [CRÍTICO] e [ALERTA] obrigatoriamente.
- Cite diretrizes (SBC, AHA, ADA, ARIA, NICE, UpToDate, etc.) quando aplicável.
- Considere sinergias e conflitos entre tratamentos de diferentes condições.
- O cabeçalho com MEDI.AI, nome do médico, CRM e dados do paciente é OBRIGATÓRIO.`;

// --- Shared specialist reports schema ---
const specialistReportSchema = z.array(
    z.object({
        specialist: z.string(),
        findings: z.string(),
        clinicalAssessment: z.string(),
        recommendations: z.string(),
    })
);

const headerSchema = z.object({
    patientName: z.string(),
    patientAge: z.number(),
    patientGender: z.string(),
    doctorName: z.string(),
    doctorCrm: z.string(),
    doctorSpecialty: z.string(),
    currentDate: z.string(),
    currentTime: z.string(),
});

// --- Prompt Definitions ---

const specificPrompt = ai.definePrompt({
    name: 'specificExamOpinionPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: {
        schema: z.object({
            examType: z.string(),
            examResults: z.string(),
            patientHistory: z.string().optional(),
            specialistReports: specialistReportSchema,
        }).merge(headerSchema),
    },
    output: { schema: z.object({ synthesis: z.string(), suggestions: z.string() }) },
    prompt: SPECIFIC_EXAM_PROMPT,
});

const globalPrompt = ai.definePrompt({
    name: 'globalOpinionPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: {
        schema: z.object({
            patientHistory: z.string(),
            examResults: z.string(),
            specialistReports: specialistReportSchema,
        }).merge(headerSchema),
    },
    output: { schema: z.object({ synthesis: z.string(), suggestions: z.string() }) },
    prompt: GLOBAL_ANALYSIS_PROMPT,
});

/**
 * Sanitizes and formats the medical opinion text to ensure proper line breaks and spacing.
 * This acts as a safety layer if the AI fails to follow formating instructions.
 */
function formatMedicalOpinionText(text: string): string {
    if (!text) return "";

    let formatted = text
        // STEP 1: Ensure line breaks BEFORE and AFTER separator lines (=== and ---)
        // The AI often concatenates text directly into separators
        .replace(/([^=\n])([=]{5,})/g, "$1\n$2")
        .replace(/([=]{5,})([^=\n])/g, "$1\n$2")
        .replace(/([^-\n])([-]{5,})/g, "$1\n$2")
        .replace(/([-]{5,})([^-\n])/g, "$1\n$2")

        // STEP 2: Ensure header fields are ALWAYS on their own lines
        // Use lookahead/lookbehind-free approach: insert \n before these keywords
        .replace(/(Data de Emissão:)/g, "\n$1")
        .replace(/(Médico Responsável:)/g, "\n$1")
        .replace(/([^\n])(CRM:)/g, "$1\n$2")
        .replace(/([^\n])(Especialidade:)/g, "$1\n$2")
        .replace(/([^\n])(PACIENTE:)/g, "$1\n$2")
        .replace(/([^\n])(Idade:)/g, "$1\n$2")
        .replace(/([^\n])(Sexo:)/g, "$1\n$2")

        // STEP 3: Double line break before ALL major section headers
        // These patterns match even when there's NO preceding newline
        .replace(/(LAUDO:)/g, "\n\n$1")
        .replace(/(CONCLUSÃO GERAL:)/g, "\n\n$1")
        .replace(/(VALORES ALTERADOS:)/g, "\n\n$1")
        .replace(/(VALORES NORMAIS RELEVANTES:)/g, "\n\n$1")
        .replace(/(IMPRESSÃO DIAGNÓSTICA:)/g, "\n\n$1")
        .replace(/(IMPRESSÃO DIAGNÓSTICA INTEGRADA:)/g, "\n\n$1")
        .replace(/(SÍNTESE CLÍNICA GLOBAL)/g, "\n\n$1")
        .replace(/(PERFIL DO PACIENTE:)/g, "\n\n$1")
        .replace(/(ACHADOS CRÍTICOS)/g, "\n\n$1")
        .replace(/(ACHADOS ALTERADOS)/g, "\n\n$1")
        .replace(/(CORRELAÇÕES ENTRE EXAMES:)/g, "\n\n$1")
        .replace(/(TRATAMENTO FARMACOLÓGICO[^:]*:?)/g, "\n\n$1")
        .replace(/(MEDIDAS NÃO FARMACOLÓGICAS:)/g, "\n\n$1")
        .replace(/(CONDUTAS E ENCAMINHAMENTOS:)/g, "\n\n$1")
        .replace(/(ENCAMINHAMENTOS PRIORITÁRIOS:)/g, "\n\n$1")
        .replace(/(EXAMES COMPLEMENTARES RECOMENDADOS:)/g, "\n\n$1")
        .replace(/(CRITÉRIOS PARA ESCALONAMENTO[^:]*:?)/g, "\n\n$1")
        .replace(/(ACOMPANHAMENTO E RETORNO:)/g, "\n\n$1")
        .replace(/(RETORNO E ACOMPANHAMENTO:)/g, "\n\n$1")
        .replace(/(INTERAÇÕES MEDICAMENTOSAS[^:]*:?)/g, "\n\n$1")

        // STEP 4: Line break before medication class headers (Classe do Medicamento, Condição)
        .replace(/(Classe do Medicamento \d+:)/g, "\n\n$1")
        .replace(/(Condição \d+:)/g, "\n\n$1")
        .replace(/([^\n])(Classe:)/g, "$1\n  $2")

        // STEP 5: Line break before bullet points that are stuck to previous text
        .replace(/([^\n])(- \[ALERTA\])/g, "$1\n$2")
        .replace(/([^\n])(- \[CRÍTICO\])/g, "$1\n$2")
        .replace(/([^\n])(- Medicamento:)/g, "$1\n$2")
        .replace(/([^\n])(- Posologia:)/g, "$1\n$2")
        .replace(/([^\n])(- Duração:)/g, "$1\n$2")
        .replace(/([^\n])(- Objetivo:)/g, "$1\n$2")
        .replace(/([^\n])(- Retorno)/g, "$1\n$2")
        .replace(/([^\n])(- Reavaliar)/g, "$1\n$2")
        .replace(/([^\n])(- Critérios)/g, "$1\n$2")
        .replace(/([^\n])(- Sinais de alerta)/g, "$1\n$2")
        .replace(/([^\n])(- Metas)/g, "$1\n$2")
        .replace(/([^\n])(- Higiene)/g, "$1\n$2")
        .replace(/([^\n])(- Controle)/g, "$1\n$2")
        .replace(/([^\n])(- Dieta)/g, "$1\n$2")

        // Generic: any "- " bullet stuck to prior text (but NOT at start of string)
        .replace(/([.)\]a-záéíóú])(- [A-Z])/g, "$1\n$2")

        // STEP 6: Line break before numbered items (1. 2. 3.) stuck to prior text
        .replace(/([.)\]a-záéíóú])(\d+\.\s+[A-Z])/g, "$1\n$2")

        // STEP 7: Line break before "Normais:" in VALORES NORMAIS
        .replace(/([^\n])(Normais:)/g, "$1\n$2")

        // STEP 8: Line break before "Especialidade:" in encaminhamentos
        .replace(/([.)\n])\s*(Especialidade:)/g, "$1\n$2")

        // STEP 9: Remove markdown bold/italic/header symbols if AI accidentally included them
        .replace(/\*\*/g, "")
        .replace(/###\s*/g, "")

        // STEP 10: Clean up excessive newlines (max 2 consecutive)
        .replace(/\n{3,}/g, "\n\n")
        // Remove leading/trailing whitespace on each line
        .split('\n').map(line => line.trimEnd()).join('\n')
        .trim();

    return formatted;
}

// --- Flow Definition ---

const generateMedicalOpinionFlow = ai.defineFlow(
    {
        name: 'generateMedicalOpinionFlow',
        inputSchema: GenerateMedicalOpinionInputSchema,
        outputSchema: GenerateMedicalOpinionOutputSchema,
    },
    async (input) => {
        const patientId = input.patientId;
        const scope = input.analysisScope || 'specific';

        console.log(`\n[Parecer Médico] 📋 Gerando parecer (${scope === 'specific' ? 'ESPECÍFICO' : 'GLOBAL'})...`);
        console.log(`[Parecer Médico] Paciente: ${patientId}`);
        console.log(`[Parecer Médico] Achados de especialistas: ${input.specialistFindings?.length || 0}`);

        // Build specialist reports, ensuring recommendations is always a string
        const specialistReports = (input.specialistFindings || []).map(sf => ({
            specialist: sf.specialist,
            findings: sf.findings,
            clinicalAssessment: sf.clinicalAssessment,
            recommendations: Array.isArray(sf.recommendations)
                ? sf.recommendations.map(r => `- ${r}`).join('\n')
                : sf.recommendations,
        }));

        // Common header data
        const headerData = {
            patientName: input.patientName || 'Não informado',
            patientAge: input.patientAge ?? 0,
            patientGender: input.patientGender || 'Não informado',
            doctorName: input.doctorName || 'Não informado',
            doctorCrm: input.doctorCrm || 'Não informado',
            doctorSpecialty: input.doctorSpecialty || 'Clínica Geral',
            currentDate: input.currentDate || new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            currentTime: input.currentTime || new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }),
        };

        let promptToUse: any;
        let synthesisInput: any;

        if (scope === 'specific') {
            promptToUse = specificPrompt;
            synthesisInput = {
                ...headerData,
                examType: input.examType || 'Exame Clínico',
                examResults: input.examResults,
                patientHistory: input.patientHistory || '',
                specialistReports,
            };
        } else {
            promptToUse = globalPrompt;
            synthesisInput = {
                ...headerData,
                patientHistory: input.patientHistory || 'Não disponível',
                examResults: input.examResults,
                specialistReports,
            };
        }

        const promptText = scope === 'specific' ? SPECIFIC_EXAM_PROMPT : GLOBAL_ANALYSIS_PROMPT;
        const inputText = promptText + JSON.stringify(synthesisInput);
        const inputTokens = countTextTokens(inputText);

        const result = await generateWithFallback({
            prompt: promptToUse,
            input: synthesisInput,
        }) as any;

        const outputText = (result.output?.synthesis || '') + (result.output?.suggestions || '');
        const outputTokens = countTextTokens(outputText);

        // Track usage
        await trackAIUsage({
            usageType: 'diagnosis',
            model: result.fallbackModel || 'googleai/gemini-2.5-flash',
            inputTokens,
            outputTokens,
            patientId,
            metadata: {
                feature: `Medical Opinion (${scope === 'specific' ? 'Specific' : 'Global'})`,
            },
        });

        console.log(`[Parecer Médico] ✅ Parecer (${scope}) gerado com sucesso`);
        console.log(`[Parecer Médico] Tokens: ${inputTokens} input + ${outputTokens} output`);

        return {
            synthesis: formatMedicalOpinionText(result.output!.synthesis),
            suggestions: formatMedicalOpinionText(result.output!.suggestions),
        };
    }
);

// --- Exported Function ---

export async function generateMedicalOpinion(
    input: GenerateMedicalOpinionInput
): Promise<GenerateMedicalOpinionOutput> {
    return generateMedicalOpinionFlow(input);
}
