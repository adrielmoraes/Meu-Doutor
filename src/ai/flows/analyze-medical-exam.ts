
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

const AnalyzeMedicalExamOutputSchema = z.object({
  preliminaryDiagnosis: z.string().describe('The preliminary diagnosis based on the combined analysis of all documents.'),
  explanation: z.string().describe('An empathetic and simple explanation of the exam results for the patient.'),
  suggestions: z.string().describe('A list of suggested next steps, such as specialist referrals (e.g., physiotherapist) or treatments to discuss with a doctor.'),
});
export type AnalyzeMedicalExamOutput = z.infer<typeof AnalyzeMedicalExamOutputSchema>;

export async function analyzeMedicalExam(input: AnalyzeMedicalExamInput): Promise<AnalyzeMedicalExamOutput> {
  return analyzeMedicalExamFlow(input);
}

const analyzeMedicalExamPrompt = ai.definePrompt({
  name: 'analyzeMedicalExamPrompt',
  input: {schema: AnalyzeMedicalExamInputSchema},
  output: {schema: AnalyzeMedicalExamOutputSchema},
  prompt: `You are an expert medical AI assistant with high emotional intelligence. Your task is to analyze medical documents and explain the findings to a patient in a simple, clear, and reassuring way, and suggest next steps.
  Your response must always be in Brazilian Portuguese.

  **Instructions:**
  1.  **Analyze the Documents:** Carefully review all the provided medical exam documents.
  2.  **Preliminary Diagnosis:** Provide a concise preliminary diagnosis based on the findings.
  3.  **Simple Explanation:** Write an explanation of the diagnosis as if you were talking to a friend who is not a doctor. Use simple analogies and avoid medical jargon.
  4.  **Actionable Suggestions:** Provide a list of concrete next steps. This should include recommendations for which specialists to consult (e.g., "Procurar um ortopedista", "Agendar uma sessão de fisioterapia") and potential treatments to discuss with their human doctor.

  **Analyze the following documents:**
  {{#each documents}}
  ---
  Document Name: {{this.fileName}}
  Document Content:
  {{media url=this.examDataUri}}
  ---
  {{/each}}
  
  Provide a single preliminary diagnosis, a unified and simple explanation, and actionable suggestions based on all the documents provided.
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
