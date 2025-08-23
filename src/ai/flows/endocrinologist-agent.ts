'use server';
/**
 * @fileOverview An AI specialist agent for endocrinology.
 *
 * - endocrinologistAgent - A flow that analyzes patient data from an endocrinology perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

const AgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string, which may contain hormone levels or glucose tests.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string, may include symptoms like fatigue, weight changes, etc.'),
});

const AgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from an endocrinology perspective. If not relevant, state that clearly."),
});

const specialistPrompt = ai.definePrompt({
    name: 'endocrinologistAgentPrompt',
    input: {schema: AgentInputSchema},
    output: {schema: AgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI endocrinologist.
    Your task is to analyze the provided patient data for issues related to the endocrine system (hormones, metabolism, diabetes).
    Look for lab results like glucose, A1c, thyroid hormones (TSH, T3, T4), or symptoms like excessive thirst, fatigue, or unexplained weight changes.
    If the data is not relevant to endocrinology, state "No specific endocrinological findings to report."

    Use the medicalKnowledgeBaseTool to look up conditions or lab results if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential endocrine issues, risks, or observations based ONLY on the data provided.
    `,
});

export const endocrinologistAgent = ai.defineFlow(
  {
    name: 'endocrinologistAgentFlow',
    inputSchema: AgentInputSchema,
    outputSchema: AgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
