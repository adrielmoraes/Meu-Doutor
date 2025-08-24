
'use server';
/**
 * @fileOverview An AI specialist agent for dermatology.
 *
 * - dermatologistAgent - A flow that analyzes patient data from a dermatology perspective.
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
    .describe('The patient medical history, may include descriptions of skin conditions, rashes, moles, etc.'),
});

const AgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from a dermatology perspective. If not relevant, state that clearly."),
});

const specialistPrompt = ai.definePrompt({
    name: 'dermatologistAgentPrompt',
    input: {schema: AgentInputSchema},
    output: {schema: AgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI dermatologist.
    Your task is to analyze the provided patient data for issues related to skin, hair, and nails.
    Look for descriptions of rashes, moles, lesions, itching, hair loss, or nail changes.
    If the data is not relevant to dermatology, state "Nenhuma observação dermatológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential dermatological issues, risks, or observations based ONLY on the data provided.
    `,
});

export const dermatologistAgent = ai.defineFlow(
  {
    name: 'dermatologistAgentFlow',
    inputSchema: AgentInputSchema,
    outputSchema: AgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
