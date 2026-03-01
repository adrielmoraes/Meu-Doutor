'use server';

/**
 * @fileOverview AI function for consolidating multiple exam analyses and generating
 * the final diagnosis after all documents have been individually analyzed.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generatePreliminaryDiagnosis } from './generate-preliminary-diagnosis';
import type { SingleDocumentOutput } from './analyze-single-exam';
import { generateWithFallback } from '@/lib/ai-resilience';
import { countTextTokens } from '@/lib/token-counter';
import { trackAIUsage } from '@/lib/usage-tracker';

export type IndividualExamResult = {
  fileName: string;
  examId: string;
  analysis: SingleDocumentOutput;
};

const ConsolidateInputSchema = z.object({
  examResults: z.array(z.object({
    fileName: z.string(),
    examId: z.string(),
    examResultsSummary: z.string(),
    patientExplanation: z.string(),
    documentType: z.string().optional(),
  })),
});

const ConsolidatedSummarySchema = z.object({
  unifiedSummary: z.string().describe("A unified comprehensive summary of ALL exam results in medical terminology"),
  unifiedPatientExplanation: z.string().describe("A unified simple, empathetic explanation for the patient in Brazilian Portuguese"),
  correlations: z.string().optional().describe("Any correlations or patterns identified across different exams"),
});

const combineAnalysesPrompt = ai.definePrompt({
  name: 'combineExamAnalysesPrompt',
  input: { schema: ConsolidateInputSchema },
  output: { schema: ConsolidatedSummarySchema },
  prompt: `Você é um assistente médico de IA. Você recebeu análises de múltiplos documentos de exame que foram processados individualmente.
Sua tarefa é criar uma análise UNIFICADA e abrangente que combina todas as descobertas de forma coerente.

**INSTRUÇÕES CRÍTICAS:**
- Combine todas as descobertas médicas em UM resumo coeso
- Identifique quaisquer correlações ou padrões entre diferentes exames
- Crie uma única explicação amigável ao paciente que cobre todos os exames
- Todo o texto voltado ao paciente deve estar em português brasileiro
- NÃO apenas concatene - sintetize e integre as informações
- Destaque conexões importantes entre diferentes resultados de exames

**⚠️ REGRAS DE INTEGRIDADE DOS DADOS (OBRIGATÓRIO):**
- **NUNCA INVENTE** valores ou resultados que não aparecem nas análises individuais.
- **PRESERVE EXATAMENTE** todos os valores numéricos como foram reportados (ex: "126 mg/dL" permanece "126 mg/dL").
- **NÃO ARREDONDE** nem aproxime valores - mantenha a precisão original.
- **SE HOUVER CONFLITO** entre exames, reporte ambos os valores com suas respectivas datas.
- Esta é informação de saúde do paciente - qualquer erro pode causar danos reais.

**Análises Individuais dos Documentos:**
{{#each examResults}}
---
📋 Documento: {{this.fileName}}
📝 Tipo: {{this.documentType}}
🔬 Resumo Médico: {{this.examResultsSummary}}
💬 Explicação ao Paciente: {{this.patientExplanation}}
---
{{/each}}

Retorne APENAS um objeto JSON simples com os campos exatos especificados. SEM marcas de markdown, SEM acentos graves.`,
});

export type ConsolidatedAnalysisOutput = {
  preliminaryDiagnosis: string;
  explanation: string;
  suggestions: string;
  structuredResults?: Array<{
    name: string;
    value: string;
    reference: string;
  }>;
  specialistFindings?: Array<{
    specialist: string;
    findings: string;
    clinicalAssessment: string;
    recommendations: string;
  }>;
  examIds: string[];
};

export async function consolidateExamsAnalysis(
  examResults: IndividualExamResult[],
  patientId: string
): Promise<ConsolidatedAnalysisOutput> {
  console.log(`[🔗 Consolidation] Consolidating ${examResults.length} exam analyses...`);

  if (examResults.length === 0) {
    throw new Error('No exam results to consolidate');
  }

  const examIds = examResults.map(r => r.examId);

  if (examResults.length === 1) {
    console.log('[🔗 Consolidation] Single exam - proceeding directly to specialist analysis...');

    const singleResult = examResults[0];
    const specialistAnalysis = await generatePreliminaryDiagnosis({
      examResults: singleResult.analysis.examResultsSummary,
      patientHistory: "Histórico não disponível nesta análise inicial.",
      patientId,
    });

    const singleExamResult = {
      preliminaryDiagnosis: specialistAnalysis.synthesis,
      explanation: singleResult.analysis.patientExplanation,
      suggestions: specialistAnalysis.suggestions,
      structuredResults: singleResult.analysis.structuredResults,
      specialistFindings: specialistAnalysis.structuredFindings,
      examIds,
    };

    // Track token usage for admin dashboard
    const inputText = singleResult.analysis.examResultsSummary;
    const outputText = singleExamResult.preliminaryDiagnosis + singleExamResult.explanation + singleExamResult.suggestions;
    const inputTokens = countTextTokens(inputText);
    const outputTokens = countTextTokens(outputText);

    await trackAIUsage({
      patientId,
      usageType: 'diagnosis',
      inputTokens,
      outputTokens,
      metadata: {
        flowName: 'consolidateExamsAnalysis',
        totalTokens: inputTokens + outputTokens,
      },
    });

    console.log(`[📊 Token Accounting] Single exam - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${inputTokens + outputTokens}`);

    return singleExamResult;
  }

  console.log('[🔗 Consolidation] Multiple exams - combining analyses first...');

  const { output: consolidatedSummary, fallbackModel } = await generateWithFallback({
    prompt: combineAnalysesPrompt,
    input: {
      examResults: examResults.map(r => ({
        fileName: r.fileName,
        examId: r.examId,
        examResultsSummary: r.analysis.examResultsSummary,
        patientExplanation: r.analysis.patientExplanation,
        documentType: r.analysis.documentType || 'Exame médico',
      })),
    },
  }) as any;

  if (!consolidatedSummary) {
    throw new Error('Failed to consolidate exam analyses');
  }

  console.log('[🔗 Consolidation] ✅ Analyses combined successfully');
  console.log('[🩺 Specialist Team] Activating multi-specialist diagnostic system...');

  const specialistAnalysis = await generatePreliminaryDiagnosis({
    examResults: consolidatedSummary.unifiedSummary,
    patientHistory: "Histórico não disponível nesta análise inicial.",
    patientId,
  });

  console.log(`[🩺 Specialist Team] ✅ Consulted ${specialistAnalysis.structuredFindings.length} specialist(s)`);

  const allStructuredResults = examResults
    .flatMap(r => r.analysis.structuredResults || []);

  const finalResult = {
    preliminaryDiagnosis: specialistAnalysis.synthesis,
    explanation: consolidatedSummary.unifiedPatientExplanation,
    suggestions: specialistAnalysis.suggestions,
    structuredResults: allStructuredResults.length > 0 ? allStructuredResults : undefined,
    specialistFindings: specialistAnalysis.structuredFindings,
    examIds,
  };

  // Track token usage for admin dashboard
  const inputText = examResults.map(r => r.analysis.examResultsSummary).join('\n');
  const outputText = finalResult.preliminaryDiagnosis + finalResult.explanation + finalResult.suggestions;
  const inputTokens = countTextTokens(inputText);
  const outputTokens = countTextTokens(outputText);

  await trackAIUsage({
    patientId,
    usageType: 'diagnosis',
    model: fallbackModel || 'googleai/gemini-2.5-flash',
    inputTokens,
    outputTokens,
    metadata: {
      flowName: 'consolidateExamsAnalysis',
      totalTokens: inputTokens + outputTokens,
    },
  });

  console.log(`[📊 Token Accounting] Input: ${inputTokens}, Output: ${outputTokens}, Total: ${inputTokens + outputTokens}`);

  return finalResult;
}
