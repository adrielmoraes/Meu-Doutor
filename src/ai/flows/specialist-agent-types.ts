
/**
 * @fileOverview Defines the shared input and output schemas for all specialist AI agents.
 * This file centralizes the types to prevent circular dependencies.
 */

import {z} from 'genkit';

export const SpecialistAgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string.'),
});
export type SpecialistAgentInput = z.infer<typeof SpecialistAgentInputSchema>;

export const SpecialistAgentOutputSchema = z.object({
  findings: z.string().describe("The specialist's findings and opinions. If not relevant, this will state so clearly."),
});
export type SpecialistAgentOutput = z.infer<typeof SpecialistAgentOutputSchema>;
