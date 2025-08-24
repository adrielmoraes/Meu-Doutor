
'use server';
/**
 * @fileOverview An AI specialist agent for pulmonology.
 *
 * - pulmonologistAgent - A flow that analyzes patient data from a pulmonology perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

const AgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string.'),
});

const AgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from a pulmonology perspective. If not relevant, state that clearly."),
});
export type AgentOutput = z.infer<typeof AgentOutputSchema>;


const specialistPrompt = ai.definePrompt({
    name: 'pulmonologistAgentPrompt',
    input: {schema: AgentInputSchema},
    output: {schema: AgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI pulmonologist.
    Your task is to analyze the provided patient data and provide your expert opinion focusing specifically on respiratory and pulmonary health.
    If the data is not relevant to pulmonology, state "Nenhuma observação pulmonar específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions, symptoms, or terms if needed to provide a more accurate analysis.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential pulmonary issues, risks, or observations based ONLY on the data provided.
    `,
});

export const pulmonologistAgent = ai.defineFlow(
  {
    name: 'pulmonologistAgentFlow',
    inputSchema: AgentInputSchema,
    outputSchema: AgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
