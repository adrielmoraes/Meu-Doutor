
'use server';
/**
 * @fileOverview An AI specialist agent for radiology.
 *
 * - radiologistAgent - A flow that analyzes patient data from a radiology perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

export const RadiologistAgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string, which may contain imaging reports.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string.'),
});
export type RadiologistAgentInput = z.infer<typeof RadiologistAgentInputSchema>;

export const RadiologistAgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from a radiology perspective, focusing on interpreting imaging results. If not relevant, state that clearly."),
});
export type RadiologistAgentOutput = z.infer<typeof RadiologistAgentOutputSchema>;


const specialistPrompt = ai.definePrompt({
    name: 'radiologistAgentPrompt',
    input: {schema: RadiologistAgentInputSchema},
    output: {schema: RadiologistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI radiologist.
    Your task is to analyze the provided patient data, looking specifically for reports from imaging exams (like X-Rays, CT Scans, MRIs) within the 'examResults' text.
    If no imaging reports are present, state "Nenhum dado radiológico para analisar."
    Your response must always be in Brazilian Portuguese.

    If imaging reports are found, provide your expert interpretation. Use the medicalKnowledgeBaseTool to clarify terms if necessary.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise interpretation of any imaging findings. Do not comment on other aspects of the patient's health.
    `,
});

const radiologistAgentFlow = ai.defineFlow(
  {
    name: 'radiologistAgentFlow',
    inputSchema: RadiologistAgentInputSchema,
    outputSchema: RadiologistAgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);

export async function radiologistAgent(input: RadiologistAgentInput): Promise<RadiologistAgentOutput> {
    return await radiologistAgentFlow(input);
}
