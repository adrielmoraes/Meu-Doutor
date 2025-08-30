
'use server';
/**
 * @fileOverview An AI specialist agent for psychiatry.
 *
 * - psychiatristAgent - A flow that analyzes patient data from a mental health perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'psychiatristAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dra. Sofia, a world-renowned AI psychiatrist.
    Your task is to analyze the provided patient data for signs and symptoms related to mental health.
    Look for descriptions of mood changes, anxiety, depression, stress, sleep disturbances, cognitive difficulties, or mentions of psychiatric conditions.
    If the data does not contain mental health information, state "Nenhuma observação psiquiátrica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or symptoms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential psychiatric issues, risks, or observations. Do not provide a formal diagnosis, but rather highlight areas of concern for a human doctor to review.
    `,
});


const psychiatristAgentFlow = ai.defineFlow(
    {
      name: 'psychiatristAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);

export async function psychiatristAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await psychiatristAgentFlow(input);
}
