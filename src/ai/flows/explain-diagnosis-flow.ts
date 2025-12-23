
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
import { countTextTokens } from '@/lib/token-counter';
import { trackAIUsage } from '@/lib/usage-tracker';

const ExplainDiagnosisInputSchema = z.object({
  patientId: z.string().optional().describe("Optional patient ID for usage tracking."),
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

const EXPLANATION_PROMPT_TEMPLATE = `You are a medical AI assistant with exceptional empathy and communication skills.
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

Provide the simplified explanation below.`;

const explainDiagnosisFlow = ai.defineFlow(
  {
    name: 'explainDiagnosisFlow',
    inputSchema: ExplainDiagnosisInputSchema,
    outputSchema: ExplainDiagnosisOutputSchema,
  },
  async input => {
    const inputTokens = countTextTokens(input.diagnosisAndNotes);
    const promptTokens = countTextTokens(EXPLANATION_PROMPT_TEMPLATE);

    const explanationResult = await explanationPrompt(input);
    const explanationText = explanationResult.output?.explanation;

    if (!explanationText) {
        throw new Error("Failed to generate an explanation.");
    }

    const outputTokens = countTextTokens(explanationText);

    if (input.patientId) {
      await trackAIUsage({
        patientId: input.patientId,
        usageType: 'diagnosis',
        inputTokens: inputTokens + promptTokens,
        outputTokens,
        metadata: {
          flowName: 'explainDiagnosisFlow',
          totalTokens: inputTokens + promptTokens + outputTokens,
        },
      });
    }
    
    const audioResult = await textToSpeech({ text: explanationText });

    const audioDataUri = audioResult?.audioDataUri || "";

    return {
      explanation: explanationText,
      audioDataUri: audioDataUri,
    };
  }
);
