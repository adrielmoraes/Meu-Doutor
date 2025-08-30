
'use server';

/**
 * @fileOverview An AI agent for analyzing medical exam documents and providing a preliminary diagnosis.
 * This version supports analyzing multiple documents as a single, coherent case.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentInputSchema = z.object({
  examDataUri: z
    .string()
    .describe(
      "A medical exam document (PDF, JPG, PNG) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    fileName: z.string().describe("The original file name of the document.")
});

const AnalyzeMedicalExamInputSchema = z.object({
  documents: z.array(DocumentInputSchema).describe("An array of medical exam documents to be analyzed together.")
});
export type AnalyzeMedicalExamInput = z.infer<typeof AnalyzeMedicalExamInputSchema>;

const StructuredResultSchema = z.object({
    name: z.string().describe("The name of the test or measurement (e.g., 'Troponina I', 'Colesterol HDL')."),
    value: z.string().describe("The measured value (e.g., '0.8 ng/mL', '150 mg/dL')."),
    reference: z.string().describe("The reference range for the test (e.g., '< 0.4 ng/mL', '40-60 mg/dL')."),
});

const AnalyzeMedicalExamOutputSchema = z.object({
  preliminaryDiagnosis: z.string().describe('The preliminary diagnosis based on the combined analysis of all documents.'),
  explanation: z.string().describe('An empathetic and simple explanation of the exam results for the patient.'),
  suggestions: z.string().describe('A list of suggested next steps, such as specialist referrals (e.g., physiotherapist) or treatments to discuss with a doctor.'),
  structuredResults: z.array(StructuredResultSchema).optional().describe("A list of structured key-value results extracted from the exams, if available (e.g., blood test results)."),
});
export type AnalyzeMedicalExamOutput = z.infer<typeof AnalyzeMedicalExamOutputSchema>;

export async function analyzeMedicalExam(input: AnalyzeMedicalExamInput): Promise<AnalyzeMedicalExamOutput> {
  return analyzeMedicalExamFlow(input);
}

const analyzeMedicalExamPrompt = ai.definePrompt({
  name: 'analyzeMedicalExamPrompt',
  input: {schema: AnalyzeMedicalExamInputSchema},
  output: {schema: AnalyzeMedicalExamOutputSchema},
  prompt: `You are an expert medical AI assistant with high emotional intelligence. Your task is to analyze medical documents, explain the findings to a patient in a simple, clear, and reassuring way, and suggest next steps.
  Your response must always be in Brazilian Portuguese.

  **Instructions:**
  1.  **Analyze the Documents:** Carefully review all the provided medical exam documents.
  2.  **Extract Structured Results:** If the document contains structured data like a blood panel or lab results, extract them into the 'structuredResults' array. For each item, capture the name, value, and reference range. If no structured data is present, this can be empty.
  3.  **Preliminary Diagnosis:** Provide a concise preliminary diagnosis based on the findings from all documents.
  4.  **Simple Explanation:** Write an explanation of the diagnosis as if you were talking to a friend who is not a doctor. Use simple analogies and avoid medical jargon.
  5.  **Actionable Suggestions:** Provide a list of concrete next steps. This should include recommendations for which specialists to consult (e.g., "Procurar um ortopedista", "Agendar uma sessão de fisioterapia") and potential treatments to discuss with their human doctor.

  **Analyze the following documents:**
  {{#each documents}}
  ---
  Document Name: {{this.fileName}}
  Document Content:
  {{media url=this.examDataUri}}
  ---
  {{/each}}
  
  Provide a single preliminary diagnosis, a unified and simple explanation, actionable suggestions, and any structured results based on all the documents provided.
  `,
});

const analyzeMedicalExamFlow = ai.defineFlow(
  {
    name: 'analyzeMedicalExamFlow',
    inputSchema: AnalyzeMedicalExamInputSchema,
    outputSchema: AnalyzeMedicalExamOutputSchema,
  },
  async input => {
    const {output} = await analyzeMedicalExamPrompt(input);
    return output!;
  }
);
