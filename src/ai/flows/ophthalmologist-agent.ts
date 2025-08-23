'use server';
/**
 * @fileOverview An AI specialist agent for ophthalmology.
 *
 * - ophthalmologistAgent - A flow that analyzes patient data from an ophthalmology perspective.
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
    .describe('The patient medical history, may include vision changes, eye pain, or headaches.'),
});

const AgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from an ophthalmology perspective. If not relevant, state that clearly."),
});

const specialistPrompt = ai.definePrompt({
    name: 'ophthalmologistAgentPrompt',
    input: {schema: AgentInputSchema},
    output: {schema: AgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI ophthalmologist.
    Your task is to analyze the provided patient data for issues related to the eyes and vision.
    Look for symptoms like blurred vision, double vision, eye pain, redness, discharge, or frequent headaches.
    If the data is not relevant to ophthalmology, state "No specific ophthalmological findings to report."

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential ophthalmological issues, risks, or observations based ONLY on the data provided.
    `,
});

export const ophthalmologistAgent = ai.defineFlow(
  {
    name: 'ophthalmologistAgentFlow',
    inputSchema: AgentInputSchema,
    outputSchema: AgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
