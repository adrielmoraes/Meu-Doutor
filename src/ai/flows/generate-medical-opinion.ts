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

// --- Prompt for SPECIFIC exam (focused, scannable, technical) ---

const SPECIFIC_EXAM_PROMPT = `Você é um médico especialista revisor de exames clínicos. Seu papel é gerar um **LAUDO TÉCNICO** conciso e altamente escaneável sobre UM ÚNICO exame clínico.

**PÚBLICO-ALVO:** Médico clínico que precisa ler este laudo em menos de 30 segundos.

**EXAME EM ANÁLISE:** {{{examType}}}

**DADOS DO EXAME:**
{{{examResults}}}

{{#if specialistReports.length}}
**PARECERES DOS ESPECIALISTAS:**
{{#each specialistReports}}
---
**{{specialist}}**
Achados: {{{findings}}}
Avaliação: {{clinicalAssessment}}
Recomendações: {{{recommendations}}}
---
{{/each}}
{{/if}}

**INSTRUÇÕES DE FORMATAÇÃO — OBRIGATÓRIAS:**

**1. SÍNTESE (campo "synthesis"):**

Estruture EXATAMENTE assim, em texto puro (SEM asteriscos, SEM hashtags):

LAUDO: [Nome do Exame]

CONCLUSÃO GERAL: [Normal / Alterado / Significativamente Alterado]

VALORES ALTERADOS:
Para CADA valor fora da normalidade, use EXATAMENTE este formato (um por linha):
- [ALERTA] [Nome do Parâmetro]: [Valor encontrado] (Ref: [referência]) — [Interpretação]

Se for crítico/urgente:
- [CRÍTICO] [Nome do Parâmetro]: [Valor encontrado] (Ref: [referência]) — [Interpretação]

VALORES NORMAIS RELEVANTES:
Normais: [Parâmetro1], [Parâmetro2]...

IMPRESSÃO DIAGNÓSTICA:
1. [Diagnóstico principal] — [Justificativa em 1 linha]
2. [Diagnóstico secundário] — [Justificativa em 1 linha]

**(NÃO inclua sugestões, condutas ou recomendações aqui nesta seção "synthesis")**

---

**2. SUGESTÕES (campo "suggestions"):**
(Coloque NESTE campo exames e condutas, em texto puro)

CONDUTAS RECOMENDADAS:
- [Ação 1] — [Diretriz]
- [Ação 2] — [Diretriz]

EXAMES COMPLEMENTARES:
- [Exame] — [Justificativa]

RETORNO:
- Reavaliar [item] em [prazo]

---

**REGRAS:**
- Escreva em Português Brasileiro.
- NÃO use emojis.
- NÃO use caracteres de Markdown como asteriscos (**) ou hashtags (###). O texto deve ser 100% limpo, apenas com letras maiúsculas para títulos e traços (-) para listas.
- Marque obrigatoriamente [ALERTA] ou [CRÍTICO] antes de cada valor alterado.
- Cada item deve caber em NO MÁXIMO 2 linhas.`;

// --- Prompt for GLOBAL analysis (comprehensive) ---

const GLOBAL_ANALYSIS_PROMPT = `Você é o Dr. Márcio Silva, Clínico Geral e Coordenador Médico em IA.

**Sua Missão:** Criar uma SÍNTESE CLÍNICA GLOBAL do paciente, integrando os achados de MÚLTIPLOS exames.

**PÚBLICO-ALVO:** Médico que quer uma visão panorâmica do paciente.

**Histórico do Paciente:**
{{{patientHistory}}}

**Resultados Consolidados:**
{{{examResults}}}

{{#if specialistReports.length}}
**Pareceres dos Especialistas (todos os exames):**
{{#each specialistReports}}
---
**{{specialist}}**
Achados: {{{findings}}}
Avaliação: {{clinicalAssessment}}
Recomendações: {{{recommendations}}}
---
{{/each}}
{{/if}}

**INSTRUÇÕES DE FORMATAÇÃO — OBRIGATÓRIAS:**

**1. SÍNTESE (campo "synthesis"):**

Estruture EXATAMENTE assim, em texto puro (SEM asteriscos, SEM hashtags):

SÍNTESE CLÍNICA GLOBAL

PERFIL: [Idade, sexo, principais condições em 1 linha]

ACHADOS CRÍTICOS (AÇÃO IMEDIATA):
- [CRÍTICO] [Achado]: [Valor] — [O que fazer agora]

ACHADOS ALTERADOS (MONITORAMENTO):
- [ALERTA] [Achado]: [Valor] — [Significado clínico resumido]

CORRELAÇÕES ENTRE EXAMES:
- [Conexão clínica 1 entre exames diferentes]
- [Conexão clínica 2]

IMPRESSÃO DIAGNÓSTICA INTEGRADA:
1. [Diagnóstico] — [Baseado em quais exames]
2. [Diagnóstico] — [Baseado em quais exames]

---

**2. SUGESTÕES (campo "suggestions"):**

PLANO DE CONDUTA PRIORITÁRIO:
1. [Ação mais urgente] — [Diretriz]
2. [Ação 2] — [Diretriz]

ENCAMINHAMENTOS:
- [Especialidade] — [Motivo]

ACOMPANHAMENTO:
- Retorno em [prazo] para [objetivo]
- Repetir [exames] em [prazo]

---

**REGRAS:**
- Português Brasileiro. Sem emojis.
- Formato de TÓPICOS, não parágrafos. Máximo 2 linhas por item.
- NÃO use caracteres de Markdown como asteriscos (**) ou hashtags (###). O texto deve ser 100% limpo.
- Marque [CRÍTICO] e [ALERTA] obrigatoriamente.
- Cite diretrizes (SBC, AHA, ADA, etc.) quando aplicável.
- Foque em integrar dados entre exames — esse é o diferencial do parecer global.`;

// --- Prompt Definitions ---

const specificPrompt = ai.definePrompt({
    name: 'specificExamOpinionPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: {
        schema: z.object({
            examType: z.string(),
            examResults: z.string(),
            specialistReports: z.array(
                z.object({
                    specialist: z.string(),
                    findings: z.string(),
                    clinicalAssessment: z.string(),
                    recommendations: z.string(),
                })
            ),
        }),
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
            specialistReports: z.array(
                z.object({
                    specialist: z.string(),
                    findings: z.string(),
                    clinicalAssessment: z.string(),
                    recommendations: z.string(),
                })
            ),
        }),
    },
    output: { schema: z.object({ synthesis: z.string(), suggestions: z.string() }) },
    prompt: GLOBAL_ANALYSIS_PROMPT,
});

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

        let promptToUse: any;
        let synthesisInput: any;

        if (scope === 'specific') {
            promptToUse = specificPrompt;
            synthesisInput = {
                examType: input.examType || 'Exame Clínico',
                examResults: input.examResults,
                specialistReports,
            };
        } else {
            promptToUse = globalPrompt;
            synthesisInput = {
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
            synthesis: result.output!.synthesis,
            suggestions: result.output!.suggestions,
        };
    }
);

// --- Exported Function ---

export async function generateMedicalOpinion(
    input: GenerateMedicalOpinionInput
): Promise<GenerateMedicalOpinionOutput> {
    return generateMedicalOpinionFlow(input);
}
