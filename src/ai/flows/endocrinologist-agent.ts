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
    Your task is to provide a technical analysis of the provided patient data, focusing strictly on the endocrine system (hormones, metabolism, diabetes).
    Your response will be reviewed by a human doctor.
    Your response must always be in Brazilian Portuguese.
    
    **Core Instructions:**
    1.  **Analyze ONLY the data provided.** Look for lab results like glucose, A1c, thyroid hormones (TSH, T3, T4), or symptoms like excessive thirst, fatigue, or unexplained weight changes.
    2.  **DO NOT ADD OR INVENT INFORMATION.** Do not mention symptoms, conditions, or results that are not explicitly present in the provided text.
    3.  **State ONLY relevant findings.** If the data contains no information relevant to endocrinology, you MUST state "Nenhuma observação endocrinológica relevante nos dados fornecidos." and nothing else.
    4.  **Be concise and technical.** Your analysis will be part of a larger report.

    Use the medicalKnowledgeBaseTool to look up conditions or lab results if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide your expert opinion based **ONLY** on the data provided.
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
