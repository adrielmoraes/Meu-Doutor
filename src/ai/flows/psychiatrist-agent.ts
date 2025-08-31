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
    Your task is to provide a technical analysis of the provided patient data, focusing strictly on signs and symptoms related to mental health.
    Your response will be reviewed by a human doctor.
    Your response must always be in Brazilian Portuguese.
    
    **Core Instructions:**
    1.  **Analyze ONLY the data provided.** Look for descriptions of mood changes, anxiety, depression, stress, sleep disturbances, cognitive difficulties, or mentions of psychiatric conditions.
    2.  **DO NOT ADD OR INVENT INFORMATION.** Do not mention symptoms, conditions, or results that are not explicitly present in the provided text.
    3.  **State ONLY relevant findings.** If the data contains no mental health information, you MUST state "Nenhuma observação psiquiátrica relevante nos dados fornecidos." and nothing else.
    4.  **Be concise and technical.** Your analysis will be part of a larger report. Do not provide a formal diagnosis, but rather highlight areas of concern for a human doctor to review.

    Use the medicalKnowledgeBaseTool to look up conditions or symptoms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide your expert opinion based **ONLY** on the data provided.
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
