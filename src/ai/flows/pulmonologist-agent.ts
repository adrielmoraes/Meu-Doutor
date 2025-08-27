
'use server';
/**
 * @fileOverview An AI specialist agent for pulmonology.
 *
 * - pulmonologistAgent - A flow that analyzes patient data from a pulmonology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './generate-preliminary-diagnosis';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './generate-preliminary-diagnosis';


const specialistPrompt = ai.definePrompt({
    name: 'pulmonologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI pulmonologist.
    Your task is to analyze the provided patient data and provide your expert opinion focusing specifically on respiratory and pulmonary health.
    If the data is not relevant to pulmonology, state "Nenhuma observação pulmonar específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions, symptoms, or terms if needed to provide a more accurate analysis.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential pulmonary issues, risks, or observations based ONLY on the data provided.
    `,
});

export async function pulmonologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    const {output} = await specialistPrompt(input);
    return output!;
}
