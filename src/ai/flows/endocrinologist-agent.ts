
'use server';
/**
 * @fileOverview An AI specialist agent for endocrinology.
 *
 * - endocrinologistAgent - A flow that analyzes patient data from an endocrinology perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

export const EndocrinologistAgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string, which may contain hormone levels or glucose tests.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string, may include symptoms like fatigue, weight changes, etc.'),
});
export type EndocrinologistAgentInput = z.infer<typeof EndocrinologistAgentInputSchema>;


export const EndocrinologistAgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from an endocrinology perspective. If not relevant, state that clearly."),
});
export type EndocrinologistAgentOutput = z.infer<typeof EndocrinologistAgentOutputSchema>;

const specialistPrompt = ai.definePrompt({
    name: 'endocrinologistAgentPrompt',
    input: {schema: EndocrinologistAgentInputSchema},
    output: {schema: EndocrinologistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI endocrinologist.
    Your task is to analyze the provided patient data for issues related to the endocrine system (hormones, metabolism, diabetes).
    Look for lab results like glucose, A1c, thyroid hormones (TSH, T3, T4), or symptoms like excessive thirst, fatigue, or unexplained weight changes.
    If the data is not relevant to endocrinology, state "Nenhuma observação endocrinológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or lab results if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential endocrine issues, risks, or observations based ONLY on the data provided.
    `,
});

const endocrinologistAgentFlow = ai.defineFlow(
  {
    name: 'endocrinologistAgentFlow',
    inputSchema: EndocrinologistAgentInputSchema,
    outputSchema: EndocrinologistAgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);

export async function endocrinologistAgent(input: EndocrinologistAgentInput): Promise<EndocrinologistAgentOutput> {
    return await endocrinologistAgentFlow(input);
}
