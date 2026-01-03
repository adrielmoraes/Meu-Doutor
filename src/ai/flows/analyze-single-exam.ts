'use server';

/**
 * @fileOverview AI function for analyzing a single medical exam document.
 * This is used for sequential processing where each document is analyzed individually
 * before consolidating results.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generateWithFallback } from '@/lib/ai-resilience';
import { countTextTokens, estimateImageTokens } from '@/lib/token-counter';
import { trackAIUsage, trackExamDocumentAnalysis } from '@/lib/usage-tracker';

const SingleDocumentInputSchema = z.object({
  examDataUri: z.string().describe("A medical exam document as a data URI"),
  fileName: z.string().describe("The original file name of the document"),
});
export type SingleDocumentInput = z.infer<typeof SingleDocumentInputSchema>;

const StructuredResultSchema = z.object({
  name: z.string().describe("The name of the test or measurement"),
  value: z.string().describe("The measured value"),
  reference: z.string().describe("The reference range for the test"),
});

const SingleDocumentOutputSchema = z.object({
  examResultsSummary: z.string().describe("A comprehensive summary of the exam results in medical terminology"),
  structuredResults: z.array(StructuredResultSchema).optional().describe("Structured lab results, if available"),
  patientExplanation: z.string().describe("A simple, empathetic explanation for the patient in Brazilian Portuguese"),
  documentType: z.string().optional().describe("The type of exam detected (e.g., blood test, X-ray, ECG)"),
  examDate: z.string().optional().describe("The date the exam was performed (collected), extracted from the document. YYYY-MM-DD or DD/MM/YYYY."),
});
export type SingleDocumentOutput = z.infer<typeof SingleDocumentOutputSchema>;

const SINGLE_EXAM_PROMPT_TEMPLATE = `Você é um assistente médico de IA analisando um documento de exame médico. Sua tarefa é:

1. **Extrair e Resumir**: Revise o documento médico e crie um resumo médico abrangente das descobertas.
2. **Estruturar Resultados**: Se houver resultados laboratoriais, extraia-os para o formato estruturado.
3. **Explicação para o Paciente**: Escreva uma explicação simples e empática das descobertas para um paciente leigo em português brasileiro.
4. **Identificar Tipo**: Identifique o tipo de exame (hemograma, raio-X, ECG, ultrassom, etc.)
5. **Extrair Data**: Encontre a data de realização/coleta do exame (não a data de impressão, se possível).

**INSTRUÇÕES CRÍTICAS:**
- **EXTRAIR DATA**: Procure por "Data da Coleta", "Data do Exame", "Realizado em".
- Seja minucioso na extração de todas as descobertas médicas
- Use terminologia médica apropriada no resumo
- Faça a explicação ao paciente calorosa, simples e reconfortante
- Use analogias e evite jargões médicos na explicação do paciente
- Todo o texto voltado ao paciente deve estar em português brasileiro

**⚠️ REGRAS DE INTEGRIDADE DOS DADOS (OBRIGATÓRIO):**
- **NUNCA INVENTE** valores, resultados ou achados que NÃO estão explicitamente no documento.
- **CITE EXATAMENTE** os valores como aparecem no exame (ex: "126 mg/dL" deve ser reportado como "126 mg/dL", não "aproximadamente 130").
- **SE NÃO ENCONTRAR** um valor ou informação, diga claramente "Não informado no documento".
- **PRESERVE** os valores de referência exatamente como aparecem no exame original.
- Esta é informação de saúde do paciente - qualquer erro pode causar danos reais.

**Analise o seguinte documento:**
Nome do Documento: {{fileName}}
Conteúdo do Documento:
{{media url=examDataUri}}

Retorne APENAS um objeto JSON simples com os campos exatos especificados. SEM marcas de markdown, SEM acentos graves.`;

const singleDocumentAnalysisPrompt = ai.definePrompt({
  name: 'singleExamDocumentAnalysisPrompt',
  input: { schema: SingleDocumentInputSchema },
  output: { schema: SingleDocumentOutputSchema },
  prompt: SINGLE_EXAM_PROMPT_TEMPLATE,
});

export async function analyzeSingleExam(input: SingleDocumentInput, patientId: string): Promise<SingleDocumentOutput> {
  console.log(`[📄 Single Exam Analysis] Analyzing document: ${input.fileName}...`);

  try {
    const imageTokens = estimateImageTokens(2048, 1536, 'high');
    const inputTextTokens = countTextTokens(input.fileName);
    const promptTokens = countTextTokens(SINGLE_EXAM_PROMPT_TEMPLATE);

    const { output } = await generateWithFallback({
      prompt: singleDocumentAnalysisPrompt,
      input: input
    });

    if (!output) {
      throw new Error('Failed to analyze document - no output received');
    }

    const outputText = output.examResultsSummary + output.patientExplanation + (output.documentType || '') + (output.examDate || '');
    const outputTokens = countTextTokens(outputText);

    await trackExamDocumentAnalysis(
      patientId,
      1,
      inputTextTokens + promptTokens,
      outputTokens,
      imageTokens,
      'googleai/gemini-2.5-flash'
    );

    console.log(`[📄 Single Exam Analysis] ✅ Document analyzed successfully: ${input.fileName}`);
    return output;
  } catch (error) {
    console.error(`[📄 Single Exam Analysis] ❌ Error analyzing document:`, error);
    throw error;
  }
}
