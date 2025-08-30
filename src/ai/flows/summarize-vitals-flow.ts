
'use server';
/**
 * @fileOverview An AI flow for summarizing a time-series of vital signs data.
 *
 * - summarizeVitals - A function that analyzes vital signs and provides a summary.
 * - SummarizeVitalsInput - The input type for the function.
 * - SummarizeVitalsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { textToSpeech } from './text-to-speech';

const VitalsDataPointSchema = z.object({
    time: z.string(),
    hr: z.number(),
    systolic: z.number(),
    diastolic: z.number(),
});

const SummarizeVitalsInputSchema = z.object({
  vitalsData: z.array(VitalsDataPointSchema).describe("An array of time-series vital signs data points."),
});
export type SummarizeVitalsInput = z.infer<typeof SummarizeVitalsInputSchema>;

const SummarizeVitalsOutputSchema = z.object({
  summary: z.string().describe('A simple, empathetic explanation of the vital signs analysis for the patient.'),
  audioDataUri: z.string().describe("The generated audio of the explanation as a data URI."),
});
export type SummarizeVitalsOutput = z.infer<typeof SummarizeVitalsOutputSchema>;


const summaryPrompt = ai.definePrompt({
  name: 'summarizeVitalsPrompt',
  input: {schema: z.object({ vitalsDataJson: z.string() }) },
  output: {schema: z.object({ summary: z.string() })},
  prompt: `You are a friendly AI medical assistant with excellent communication skills.
Your task is to analyze a series of vital signs data and provide a simple, clear, and reassuring summary for a patient.
Your response must always be in Brazilian Portuguese.

- Analyze the data for trends, stability, and any notable spikes or dips.
- Keep the language simple and avoid overly technical jargon.
- If the data is generally stable and within normal ranges, be reassuring.
- If there are any points of concern (e.g., high blood pressure spikes, elevated heart rate), mention them calmly and suggest that it's good information to share with a doctor.
- Do NOT provide a diagnosis.

Here is the vital signs data in JSON format:
{{{vitalsDataJson}}}

Provide a concise summary of your analysis below.`,
});

const summarizeVitalsFlow = ai.defineFlow(
  {
    name: 'summarizeVitalsFlow',
    inputSchema: SummarizeVitalsInputSchema,
    outputSchema: SummarizeVitalsOutputSchema,
  },
  async input => {
    // Step 1: Generate the text-based summary.
    // We stringify the JSON to pass it into the prompt, which is more reliable for complex objects.
    const summaryResult = await summaryPrompt({ vitalsDataJson: JSON.stringify(input.vitalsData, null, 2) });
    const summaryText = summaryResult.output?.summary;

    if (!summaryText) {
        throw new Error("Failed to generate a summary for the vital signs.");
    }
    
    // Step 2: Generate the audio for the summary text.
    const audioResult = await textToSpeech({ text: summaryText });

    // Make the flow resilient. If audio fails, we can still return the text.
    const audioDataUri = audioResult?.audioDataUri || "";

    // Step 3: Return both the text summary and the audio URI.
    return {
      summary: summaryText,
      audioDataUri: audioDataUri,
    };
  }
);


export async function summarizeVitals(
  input: SummarizeVitalsInput
): Promise<SummarizeVitalsOutput> {
  return summarizeVitalsFlow(input);
}
