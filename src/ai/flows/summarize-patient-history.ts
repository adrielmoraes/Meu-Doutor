'use server';

/**
 * @fileOverview Summarizes a patient's past interactions with the AI assistant.
 *
 * - summarizePatientHistory - A function that summarizes patient history.
 * - SummarizePatientHistoryInput - The input type for the summarizePatientHistory function.
 * - SummarizePatientHistoryOutput - The return type for the summarizePatientHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePatientHistoryInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe("The patient's conversation history with the AI assistant."),
  reportedSymptoms: z.string().describe('The symptoms reported by the patient.'),
});
export type SummarizePatientHistoryInput = z.infer<
  typeof SummarizePatientHistoryInputSchema
>;

const SummarizePatientHistoryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of the patient history, including reported symptoms and conversation highlights.'
    ),
});
export type SummarizePatientHistoryOutput = z.infer<
  typeof SummarizePatientHistoryOutputSchema
>;

export async function summarizePatientHistory(
  input: SummarizePatientHistoryInput
): Promise<SummarizePatientHistoryOutput> {
  return summarizePatientHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePatientHistoryPrompt',
  input: {schema: SummarizePatientHistoryInputSchema},
  output: {schema: SummarizePatientHistoryOutputSchema},
  prompt: `You are an AI assistant summarizing patient history for doctors.

  Summarize the following patient information, including reported symptoms and conversation history, into a concise summary for the doctor:

  Reported Symptoms: {{{reportedSymptoms}}}
  Conversation History: {{{conversationHistory}}}
  `,
});

const summarizePatientHistoryFlow = ai.defineFlow(
  {
    name: 'summarizePatientHistoryFlow',
    inputSchema: SummarizePatientHistoryInputSchema,
    outputSchema: SummarizePatientHistoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
