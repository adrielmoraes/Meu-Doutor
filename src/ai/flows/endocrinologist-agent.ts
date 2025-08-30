
'use server';
/**
 * @fileOverview An AI specialist agent for endocrinology.
 *
 * - endocrinologistAgent - A flow that analyzes patient data from an endocrinology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';

const specialistPrompt = ai.definePrompt({
    name: 'endocrinologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dra. Beatriz, a world-renowned AI endocrinologist.
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
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);

export async function endocrinologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await endocrinologistAgentFlow(input);
}
