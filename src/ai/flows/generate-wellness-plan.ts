'use server';
/**
 * @fileOverview An AI flow for generating a personalized wellness plan for a patient.
 *
 * - generateWellnessPlan - A function that creates a wellness plan.
 * - GenerateWellnessPlanInput - The input type for the function.
 * - GenerateWellnessPlanOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { nutritionistAgent } from './nutritionist-agent';

export const GenerateWellnessPlanInputSchema = z.object({
    patientHistory: z.string().describe("A summary of the patient's medical history and current conditions."),
    examResults: z.string().describe('A summary of the latest exam results.'),
});
export type GenerateWellnessPlanInput = z.infer<typeof GenerateWellnessPlanInputSchema>;

export const GenerateWellnessPlanOutputSchema = z.object({
  dietaryPlan: z.string().describe("A detailed, actionable dietary plan. Should include meal suggestions and foods to include/avoid."),
  exercisePlan: z.string().describe("A simple, safe exercise and physical activity plan suitable for the patient's condition."),
  mentalWellnessPlan: z.string().describe("Recommendations for managing stress, improving sleep, and other mental well-being practices."),
});
export type GenerateWellnessPlanOutput = z.infer<typeof GenerateWellnessPlanOutputSchema>;


const wellnessPlanPrompt = ai.definePrompt({
    name: 'generateWellnessPlanPrompt',
    input: { schema: z.object({
        patientHistory: z.string(),
        nutritionistReport: z.string(),
    }) },
    output: { schema: GenerateWellnessPlanOutputSchema },
    prompt: `You are a holistic health AI assistant. Your task is to create a comprehensive and encouraging wellness plan for a patient.

    You will receive a summary of the patient's history and a detailed report from a nutritionist AI.
    Your job is to synthesize this information into three key areas: Diet, Exercise, and Mental Wellness.

    - For the Dietary Plan, use the nutritionist's report as the primary source. Reformat it to be very clear, encouraging, and easy for the patient to follow.
    - For the Exercise Plan, suggest simple, safe, and low-impact activities (like walking, stretching) that are generally beneficial. Emphasize starting slow.
    - For the Mental Wellness Plan, provide common-sense advice on stress management (e.g., deep breathing), sleep hygiene, and mindfulness.

    Keep the tone positive, supportive, and motivational.

    Patient History Summary:
    {{{patientHistory}}}

    Nutritionist AI Report:
    {{{nutritionistReport}}}

    Now, generate the complete wellness plan below.`,
});


export const generateWellnessPlan = ai.defineFlow(
    {
      name: 'generateWellnessPlanFlow',
      inputSchema: GenerateWellnessPlanInputSchema,
      outputSchema: GenerateWellnessPlanOutputSchema,
    },
    async (input) => {
        // 1. Consult the nutritionist to get expert dietary advice.
        const nutritionistReport = await nutritionistAgent(input);

        // 2. Synthesize all information into a holistic plan.
        const { output } = await wellnessPlanPrompt({
            patientHistory: input.patientHistory,
            nutritionistReport: nutritionistReport.findings,
        });

        return output!;
    }
);
