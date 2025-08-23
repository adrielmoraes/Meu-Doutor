'use server';

/**
 * @fileOverview An AI agent for analyzing medical exam documents and providing a preliminary diagnosis.
 *
 * - analyzeMedicalExam - A function that handles the medical exam analysis process.
 * - AnalyzeMedicalExamInput - The input type for the analyzeMedicalExam function.
 * - AnalyzeMedicalExamOutput - The return type for the analyzeMedicalExam function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMedicalExamInputSchema = z.object({
  examDataUri: z
    .string()
    .describe(
      "A medical exam document (PDF, JPG, PNG) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeMedicalExamInput = z.infer<typeof AnalyzeMedicalExamInputSchema>;

const AnalyzeMedicalExamOutputSchema = z.object({
  preliminaryDiagnosis: z.string().describe('The preliminary diagnosis based on the exam analysis.'),
  explanation: z.string().describe('An understandable explanation of the exam results.'),
});
export type AnalyzeMedicalExamOutput = z.infer<typeof AnalyzeMedicalExamOutputSchema>;

export async function analyzeMedicalExam(input: AnalyzeMedicalExamInput): Promise<AnalyzeMedicalExamOutput> {
  return analyzeMedicalExamFlow(input);
}

const analyzeMedicalExamPrompt = ai.definePrompt({
  name: 'analyzeMedicalExamPrompt',
  input: {schema: AnalyzeMedicalExamInputSchema},
  output: {schema: AnalyzeMedicalExamOutputSchema},
  prompt: `You are a medical AI assistant that analyzes medical exam documents and provides a preliminary diagnosis and understandable explanation of the results.

  Analyze the following medical exam document:
  {{media url=examDataUri}}
  
  Provide a preliminary diagnosis and explain the results in a way that is easy for a patient to understand.
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
