'use server';
/**
 * @fileOverview An AI flow for generating preventive health insights and actionable goals.
 *
 * - generateHealthInsights - A function that creates a preventive and predictive health plan.
 * - GenerateHealthInsightsInput - The input type for the function.
 * - GenerateHealthInsightsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GoalSchema = z.object({
    title: z.string().describe("A short, clear title for the health goal (e.g., 'Reduce Blood Pressure')."),
    description: z.string().describe("A brief explanation of why this goal is important for the patient."),
    progress: z.number().min(0).max(100).describe("The patient's current progress towards this goal, as a percentage (0-100). For new plans, this should start at 0 or a low number."),
});

const GenerateHealthInsightsInputSchema = z.object({
    patientHistory: z.string().describe("A comprehensive summary of the patient's medical history, current conditions, and lifestyle."),
    validatedDiagnosis: z.string().describe("The doctor's final, validated diagnosis and notes."),
});
export type GenerateHealthInsightsInput = z.infer<typeof GenerateHealthInsightsInputSchema>;

const GenerateHealthInsightsOutputSchema = z.object({
  preventiveAlerts: z.array(z.string()).describe("A list of 2-3 potential future health risks based on the patient's current data. Phrase these as opportunities for prevention (e.g., 'Opportunity to improve cardiovascular health by managing cholesterol')."),
  healthGoals: z.array(GoalSchema).describe("A list of 2-3 actionable, measurable health goals for the patient to work towards."),
});
export type GenerateHealthInsightsOutput = z.infer<typeof GenerateHealthInsightsOutputSchema>;


const healthInsightsPrompt = ai.definePrompt({
    name: 'generateHealthInsightsPrompt',
    input: { schema: GenerateHealthInsightsInputSchema },
    output: { schema: GenerateHealthInsightsOutputSchema },
    prompt: `You are a proactive and insightful AI Health Coach and Preventive Medicine Specialist.
    Your task is to analyze the patient's data and generate a forward-looking health plan that focuses on prevention and actionable goals.

    1.  **Analyze for Future Risks (Preventive Alerts):** Based on the patient's history and validated diagnosis, identify 2-3 key health risks they may face in the future if their current trajectory continues. Frame these positively, as "preventive opportunities." For example, instead of "You are at risk for diabetes," say "There is an opportunity to manage blood sugar levels to prevent future complications."

    2.  **Define Actionable Goals (Health Goals):** Based on the diagnosis, create 2-3 concrete, measurable goals that the patient can track. For each goal, provide a clear title, a brief description of its importance, and an initial progress value (usually starting at 0 or a low percentage).

    Patient's Medical History & Lifestyle Summary:
    {{{patientHistory}}}

    Doctor's Validated Diagnosis & Notes:
    {{{validatedDiagnosis}}}

    Generate the preventive alerts and health goals below.`,
});


export async function generateHealthInsights(
    input: GenerateHealthInsightsInput
): Promise<GenerateHealthInsightsOutput> {
    const generateHealthInsightsFlow = ai.defineFlow(
        {
          name: 'generateHealthInsightsFlow',
          inputSchema: GenerateHealthInsightsInputSchema,
          outputSchema: GenerateHealthInsightsOutputSchema,
        },
        async (input) => {
            const { output } = await healthInsightsPrompt(input);
            return output!;
        }
    );
    return generateHealthInsightsFlow(input);
}
