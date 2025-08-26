
'use server';
/**
 * @fileOverview An AI specialist agent for neurology.
 *
 * - neurologistAgent - A flow that analyzes patient data from a neurology perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

export const NeurologistAgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string, may include symptoms like headaches, dizziness, etc.'),
});
export type NeurologistAgentInput = z.infer<typeof NeurologistAgentInputSchema>;

export const NeurologistAgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from a neurology perspective. If not relevant, state that clearly."),
});
export type NeurologistAgentOutput = z.infer<typeof NeurologistAgentOutputSchema>;

const specialistPrompt = ai.definePrompt({
    name: 'neurologistAgentPrompt',
    input: {schema: NeurologistAgentInputSchema},
    output: {schema: NeurologistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI neurologist.
    Your task is to analyze the provided patient data and provide your expert opinion focusing specifically on neurological health.
    Look for symptoms like headaches, dizziness, numbness, memory issues, or seizures.
    If the data is not relevant to neurology, state "Nenhuma observação neurológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions, symptoms, or terms if needed to provide a more accurate analysis.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential neurological issues, risks, or observations based ONLY on the data provided.
    `,
});

export const neurologistAgent = ai.defineFlow(
  {
    name: 'neurologistAgentFlow',
    inputSchema: NeurologistAgentInputSchema,
    outputSchema: NeurologistAgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
