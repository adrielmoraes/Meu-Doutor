'use server';
/**
 * @fileOverview An AI specialist agent for orthopedics.
 *
 * - orthopedistAgent - A flow that analyzes patient data from an orthopedic perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

const AgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string, may contain imaging reports like X-rays.'),
  patientHistory: z
    .string()
    .describe('The patient medical history, may include joint pain, fractures, or mobility issues.'),
});

const AgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from an orthopedic perspective. If not relevant, state that clearly."),
});

const specialistPrompt = ai.definePrompt({
    name: 'orthopedistAgentPrompt',
    input: {schema: AgentInputSchema},
    output: {schema: AgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI orthopedist.
    Your task is to analyze the provided patient data for issues related to the musculoskeletal system (bones, joints, ligaments, tendons, muscles).
    Look for symptoms like joint pain, swelling, stiffness, fractures, or difficulty with movement. Also consider imaging reports.
    If the data is not relevant to orthopedics, state "No specific orthopedic findings to report."

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential orthopedic issues, risks, or observations based ONLY on the data provided.
    `,
});

export const orthopedistAgent = ai.defineFlow(
  {
    name: 'orthopedistAgentFlow',
    inputSchema: AgentInputSchema,
    outputSchema: AgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
