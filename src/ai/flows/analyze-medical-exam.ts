
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
  explanation: z.string().describe('An understandable explanation of the exam results from all documents.'),
});
export type AnalyzeMedicalExamOutput = z.infer<typeof AnalyzeMedicalExamOutputSchema>;

export async function analyzeMedicalExam(input: AnalyzeMedicalExamInput): Promise<AnalyzeMedicalExamOutput> {
  return analyzeMedicalExamFlow(input);
}

const analyzeMedicalExamPrompt = ai.definePrompt({
  name: 'analyzeMedicalExamPrompt',
  input: {schema: AnalyzeMedicalExamInputSchema},
  output: {schema: AnalyzeMedicalExamOutputSchema},
  prompt: `You are a medical AI assistant that analyzes a collection of medical exam documents and provides a single, coherent preliminary diagnosis and an understandable explanation of the results.
  Your response must always be in Brazilian Portuguese.

  Analyze the following collection of medical exam documents. Synthesize the information from all of them to form your conclusion.
  
  {{#each documents}}
  ---
  Document Name: {{this.fileName}}
  Document Content:
  {{media url=this.examDataUri}}
  ---
  {{/each}}
  
  Provide a single preliminary diagnosis and a unified explanation based on all the documents provided.
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
