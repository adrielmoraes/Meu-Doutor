
'use server';
/**
 * @fileOverview An AI flow for triaging the urgency of a preliminary diagnosis.
 *
 * - triageUrgency - A function that classifies the urgency of a case.
 * - TriageUrgencyInput - The input type for the function.
 * - TriageUrgencyOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UrgencyLevelSchema = z.enum(['Urgente', 'Alta', 'Normal']);
export type UrgencyLevel = z.infer<typeof UrgencyLevelSchema>;

const TriageUrgencyInputSchema = z.object({
  diagnosisSynthesis: z
    .string()
    .describe("The preliminary diagnosis synthesis from the specialist AI team."),
});
export type TriageUrgencyInput = z.infer<typeof TriageUrgencyInputSchema>;

const TriageUrgencyOutputSchema = z.object({
  priority: UrgencyLevelSchema.describe("The assessed priority level for the case."),
});
export type TriageUrgencyOutput = z.infer<typeof TriageUrgencyOutputSchema>;

const triagePrompt = ai.definePrompt({
    name: 'triageUrgencyPrompt',
    input: { schema: TriageUrgencyInputSchema },
    output: { schema: TriageUrgencyOutputSchema },
    prompt: `You are an expert triage AI, equivalent to an experienced emergency room doctor or head nurse.
    Your task is to analyze a preliminary diagnosis and assign an urgency level.
    Your response must always be in Brazilian Portuguese.

    - **Urgente:** Assign this for conditions that are immediately life-threatening or require immediate medical intervention (e.g., suspected heart attack, stroke, severe respiratory distress).
    - **Alta:** Assign this for serious conditions that require prompt attention but are not immediately life-threatening (e.g., new diagnosis of a significant condition like cancer or uncontrolled diabetes, severe infections).
    - **Normal:** Assign this for routine cases, chronic stable conditions, or non-critical issues (e.g., mild skin rash, chronic controlled migraine, routine follow-up).

    Preliminary Diagnosis Synthesis:
    {{{diagnosisSynthesis}}}

    Based on this information, determine the correct priority level.`,
});

export async function triageUrgency(
  input: TriageUrgencyInput
): Promise<TriageUrgencyOutput> {
    const triageUrgencyFlow = ai.defineFlow(
        {
          name: 'triageUrgencyFlow',
          inputSchema: TriageUrgencyInputSchema,
          outputSchema: TriageUrgencyOutputSchema,
        },
        async (input) => {
            const { output } = await triagePrompt(input);
            return output!;
        }
    );
    return triageUrgencyFlow(input);
}
