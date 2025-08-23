'use server';
/**
 * @fileOverview AI flow for orchestrating a team of specialist agents to generate a preliminary diagnosis.
 *
 * - generatePreliminaryDiagnosis - Function that acts as a General Practitioner AI, coordinating specialists.
 * - GeneratePreliminaryDiagnosisInput - Input type for the function.
 * - GeneratePreliminaryDiagnosisOutput - Output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { cardiologistAgent } from './cardiologist-agent';

const GeneratePreliminaryDiagnosisInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string.'),
});
export type GeneratePreliminaryDiagnosisInput = z.infer<
  typeof GeneratePreliminaryDiagnosisInputSchema
>;

const GeneratePreliminaryDiagnosisOutputSchema = z.object({
  diagnosis: z.string().describe('The preliminary diagnosis synthesized by the orchestrator AI.'),
  suggestions: z
    .string()
    .describe('Suggestions for next steps and further tests, based on specialist input.'),
});
export type GeneratePreliminaryDiagnosisOutput = z.infer<
  typeof GeneratePreliminaryDiagnosisOutputSchema
>;

export async function generatePreliminaryDiagnosis(
  input: GeneratePreliminaryDiagnosisInput
): Promise<GeneratePreliminaryDiagnosisOutput> {
  return generatePreliminaryDiagnosisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePreliminaryDiagnosisPrompt',
  input: {schema: GeneratePreliminaryDiagnosisInputSchema},
  output: {schema: GeneratePreliminaryDiagnosisOutputSchema},
  prompt: `You are an AI General Practitioner, an orchestrator for a team of AI medical specialists.
Your role is to analyze the patient's data and determine which specialist to consult.

Patient's exam results:
{{examResults}}

Patient's history and symptoms summary:
{{patientHistory}}

Based on this information, you will call the appropriate specialist agent to get their expert opinion.
After receiving the specialist's analysis, you will synthesize it into a clear preliminary diagnosis and provide suggestions for next steps.

Today, you consulted with an AI Cardiologist, who provided the following analysis:
{{specialistAnalysis}}

Now, create the final diagnosis and suggestions for the human doctor.`,
});

const generatePreliminaryDiagnosisFlow = ai.defineFlow(
  {
    name: 'generatePreliminaryDiagnosisFlow',
    inputSchema: GeneratePreliminaryDiagnosisInputSchema,
    outputSchema: GeneratePreliminaryDiagnosisOutputSchema,
  },
  async input => {
    // In a real system, logic would determine which specialist(s) to call.
    // For this example, we'll directly call the cardiologist agent.
    const specialistAnalysis = await cardiologistAgent(input);

    // Now, call the orchestrator prompt, feeding it the specialist's analysis.
    const {output} = await prompt({
        ...input,
        specialistAnalysis: specialistAnalysis.findings,
    });
    return output!;
  }
);
