
'use server';
/**
 * @fileOverview An AI specialist agent for neurology.
 *
 * - neurologistAgent - A flow that analyzes patient data from a neurology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'neurologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dr. Daniel, a world-renowned AI neurologist.
    Your task is to analyze the provided patient data and provide your expert opinion focusing specifically on neurological health.
    Look for symptoms like headaches, dizziness, numbness, memory issues, or seizures.
    If the data is not relevant to neurology, state "Nenhuma observação neurológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions, symptoms, or terms if needed to provide a more accurate analysis.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential neurological issues, risks, or observations based ONLY on the data provided.
    `,
});

const neurologistAgentFlow = ai.defineFlow(
    {
      name: 'neurologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);


export async function neurologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await neurologistAgentFlow(input);
}
