
'use server';
/**
 * @fileOverview An AI flow for explaining a doctor's final diagnosis to a patient.
 *
 * - explainDiagnosisToPatient - A function that simplifies and explains a diagnosis.
 * - ExplainDiagnosisInput - The input type for the function.
 * - ExplainDiagnosisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { textToSpeech } from './text-to-speech';

const ExplainDiagnosisInputSchema = z.object({
  diagnosisAndNotes: z
    .string()
    .describe("The doctor's final validated diagnosis and prescription notes."),
});
export type ExplainDiagnosisInput = z.infer<typeof ExplainDiagnosisInputSchema>;

const ExplainDiagnosisOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A simple, empathetic explanation of the diagnosis for the patient.'),
  audioDataUri: z
    .string()
    .describe("The generated audio of the explanation as a data URI."),
});
export type ExplainDiagnosisOutput = z.infer<typeof ExplainDiagnosisOutputSchema>;

export async function explainDiagnosisToPatient(
  input: ExplainDiagnosisInput
): Promise<ExplainDiagnosisOutput> {
  return explainDiagnosisFlow(input);
}

const explanationPrompt = ai.definePrompt({
  name: 'explainDiagnosisPrompt',
  input: {schema: ExplainDiagnosisInputSchema},
  output: {schema: z.object({ explanation: z.string() })},
  prompt: `You are a medical AI assistant with exceptional empathy and communication skills.
Your task is to act as a "medical translator" for patients.
You will receive a doctor's final diagnosis and notes. You must translate this into a simple, clear, and reassuring explanation that a patient can easily understand.
Your response must always be in Brazilian Portuguese.

- Avoid complex medical jargon.
- Use analogies if helpful.
- Break down the information into logical parts (What is it?, What does it mean?, What are the next steps?).
- Maintain a positive and supportive tone.
- Explain the purpose of any prescribed medication or treatment in simple terms.

Doctor's validated diagnosis and notes:
{{{diagnosisAndNotes}}}

Provide the simplified explanation below.`,
});

const explainDiagnosisFlow = ai.defineFlow(
  {
    name: 'explainDiagnosisFlow',
    inputSchema: ExplainDiagnosisInputSchema,
    outputSchema: ExplainDiagnosisOutputSchema,
  },
  async input => {
    // Step 1: Generate the full, simplified text explanation first.
    const explanationResult = await explanationPrompt(input);
    const explanationText = explanationResult.output?.explanation;

    if (!explanationText) {
        throw new Error("Failed to generate an explanation.");
    }
    
    // Step 2: Now that we have the complete text, generate the audio for it.
    const audioResult = await textToSpeech({ text: explanationText });

    // If the audio generation failed, we can still proceed with just the text.
    const audioDataUri = audioResult?.audioDataUri || "";

    // Step 3: Return both the final text and the complete audio.
    return {
      explanation: explanationText,
      audioDataUri: audioDataUri,
    };
  }
);
