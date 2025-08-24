
'use server';
/**
 * @fileOverview An AI specialist agent for otolaryngology (ENT).
 *
 * - otolaryngologistAgent - A flow that analyzes patient data from an ENT perspective.
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
    .describe('The patient medical history, may include symptoms like ear pain, hearing loss, sore throat, or sinus issues.'),
});

const AgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from an otolaryngology (ENT) perspective. If not relevant, state that clearly."),
});

const specialistPrompt = ai.definePrompt({
    name: 'otolaryngologistAgentPrompt',
    input: {schema: AgentInputSchema},
    output: {schema: AgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI otolaryngologist (Ear, Nose, and Throat specialist).
    Your task is to analyze the provided patient data for issues related to the ear, nose, throat, sinuses, and larynx.
    Look for symptoms like earaches, hearing loss, tinnitus, vertigo, nasal congestion, sinus pain, sore throat, or hoarseness.
    If the data is not relevant to otolaryngology, state "Nenhuma observação otorrinolaringológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential ENT issues, risks, or observations based ONLY on the data provided.
    `,
});

export const otolaryngologistAgent = ai.defineFlow(
  {
    name: 'otolaryngologistAgentFlow',
    inputSchema: AgentInputSchema,
    outputSchema: AgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
