
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
  findings: z.string().describe("The specialist's detailed clinical findings based on the provided data."),
  clinicalAssessment: z.string().describe("Professional assessment of the severity and urgency of findings (normal, mild, moderate, severe, critical, or not applicable)."),
  recommendations: z.string().describe("Specific recommendations for follow-up, additional tests, or immediate actions within this specialty."),
  relevantMetrics: z.array(z.object({
    metric: z.string().describe("Name of the clinical metric or finding (e.g., 'Blood Pressure', 'ECG QT Interval')"),
    value: z.string().describe("The observed value or description"),
    status: z.enum(['normal', 'borderline', 'abnormal', 'critical']).describe("Clinical significance of this metric")
  })).optional().describe("Key clinical metrics and their status, if applicable to this specialty."),
});
export type SpecialistAgentOutput = z.infer<typeof SpecialistAgentOutputSchema>;
