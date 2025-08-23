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
import {cardiologistAgent} from './cardiologist-agent';
import {pulmonologistAgent} from './pulmonologist-agent';
import {radiologistAgent} from './radiologist-agent';
import {neurologistAgent} from './neurologist-agent';
import {gastroenterologistAgent} from './gastroenterologist-agent';
import {endocrinologistAgent} from './endocrinologist-agent';
import {dermatologistAgent} from './dermatologist-agent';
import {orthopedistAgent} from './orthopedist-agent';
import {ophthalmologistAgent} from './ophthalmologist-agent';
import {otolaryngologistAgent} from './otolaryngologist-agent';
import {nutritionistAgent} from './nutritionist-agent';

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
  diagnosis: z
    .string()
    .describe(
      'The comprehensive preliminary diagnosis synthesized by the orchestrator AI from all specialist findings.'
    ),
  suggestions: z
    .string()
    .describe(
      'Actionable suggestions for next steps and further tests, based on the combined specialist input.'
    ),
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
  input: {schema: z.any()},
  output: {schema: GeneratePreliminaryDiagnosisOutputSchema},
  prompt: `You are an expert AI General Practitioner, an orchestrator for a team of AI medical specialists.
Your role is to synthesize the findings from your specialist team into a single, coherent preliminary diagnosis.

Patient's exam results:
{{examResults}}

Patient's history and symptoms summary:
{{patientHistory}}

You have consulted with your team of specialists, and here are their reports:

Cardiology Report:
{{cardiologistReport}}

Pulmonology Report:
{{pulmonologistReport}}

Radiology Report:
{{radiologistReport}}

Neurology Report:
{{neurologistReport}}

Gastroenterology Report:
{{gastroenterologistReport}}

Endocrinology Report:
{{endocrinologistReport}}

Dermatology Report:
{{dermatologistReport}}

Orthopedics Report:
{{orthopedistReport}}

Ophthalmology Report:
{{ophthalmologistReport}}

Otolaryngology (ENT) Report:
{{otolaryngologistReport}}

Nutrition Report:
{{nutritionistReport}}

Synthesize all these reports into a clear, comprehensive preliminary diagnosis. Provide actionable suggestions for next steps or further tests based on the combined findings. Address the report to the human doctor reviewing the case.`,
});

const generatePreliminaryDiagnosisFlow = ai.defineFlow(
  {
    name: 'generatePreliminaryDiagnosisFlow',
    inputSchema: GeneratePreliminaryDiagnosisInputSchema,
    outputSchema: GeneratePreliminaryDiagnosisOutputSchema,
  },
  async input => {
    // 1. Call all specialist agents in parallel to get their expert opinions.
    const [
      cardiologyReport,
      pulmonologyReport,
      radiologyReport,
      neurologyReport,
      gastroenterologyReport,
      endocrinologyReport,
      dermatologistReport,
      orthopedistReport,
      ophthalmologistReport,
      otolaryngologistReport,
      nutritionistReport,
    ] = await Promise.all([
      cardiologistAgent(input),
      pulmonologistAgent(input),
      radiologistAgent(input),
      neurologistAgent(input),
      gastroenterologistAgent(input),
      endocrinologistAgent(input),
      dermatologistAgent(input),
      orthopedistAgent(input),
      ophthalmologistAgent(input),
      otolaryngologistAgent(input),
      nutritionistAgent(input),
    ]);

    // 2. Call the orchestrator prompt, feeding it the specialists' analyses.
    const {output} = await prompt({
      ...input,
      cardiologistReport: cardiologyReport.findings,
      pulmonologistReport: pulmonologyReport.findings,
      radiologistReport: radiologyReport.findings,
      neurologistReport: neurologyReport.findings,
      gastroenterologistReport: gastroenterologyReport.findings,
      endocrinologistReport: endocrinologyReport.findings,
      dermatologistReport: dermatologistReport.findings,
      orthopedistReport: orthopedistReport.findings,
      ophthalmologistReport: ophthalmologistReport.findings,
      otolaryngologistReport: otolaryngologistReport.findings,
      nutritionistReport: nutritionistReport.findings,
    });

    return output!;
  }
);
