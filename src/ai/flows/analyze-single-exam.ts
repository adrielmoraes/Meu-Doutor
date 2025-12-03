'use server';

/**
 * @fileOverview AI function for analyzing a single medical exam document.
 * This is used for sequential processing where each document is analyzed individually
 * before consolidating results.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
});
export type SingleDocumentOutput = z.infer<typeof SingleDocumentOutputSchema>;

const singleDocumentAnalysisPrompt = ai.definePrompt({
  name: 'singleExamDocumentAnalysisPrompt',
  input: { schema: SingleDocumentInputSchema },
  output: { schema: SingleDocumentOutputSchema },
  prompt: `Você é um assistente médico de IA analisando um documento de exame médico. Sua tarefa é:

1. **Extrair e Resumir**: Revise o documento médico e crie um resumo médico abrangente das descobertas.
2. **Estruturar Resultados de Laboratório**: Se o documento contém resultados de laboratório (exames de sangue, etc.), extraia-os em formato estruturado.
3. **Explicação para o Paciente**: Escreva uma explicação simples e empática das descobertas para um paciente leigo em português brasileiro.
4. **Identificar Tipo**: Identifique o tipo de exame (hemograma, raio-X, ECG, ultrassom, etc.)

**INSTRUÇÕES CRÍTICAS:**
- Seja minucioso na extração de todas as descobertas médicas
- Use terminologia médica apropriada no resumo
- Faça a explicação ao paciente calorosa, simples e reconfortante
- Use analogias e evite jargões médicos na explicação do paciente
- Todo o texto voltado ao paciente deve estar em português brasileiro

**Analise o seguinte documento:**
Nome do Documento: {{fileName}}
Conteúdo do Documento:
{{media url=examDataUri}}

Retorne APENAS um objeto JSON simples com os campos exatos especificados. SEM marcas de markdown, SEM acentos graves.`,
});

export async function analyzeSingleExam(input: SingleDocumentInput): Promise<SingleDocumentOutput> {
  console.log(`[📄 Single Exam Analysis] Analyzing document: ${input.fileName}...`);
  
  try {
    const { output } = await singleDocumentAnalysisPrompt(input);
    
    if (!output) {
      throw new Error('Failed to analyze document - no output received');
    }
    
    console.log(`[📄 Single Exam Analysis] ✅ Document analyzed successfully: ${input.fileName}`);
    return output;
  } catch (error) {
    console.error(`[📄 Single Exam Analysis] ❌ Error analyzing document:`, error);
    throw error;
  }
}
