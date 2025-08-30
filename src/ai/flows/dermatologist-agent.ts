
'use server';
/**
 * @fileOverview An AI specialist agent for dermatology.
 *
 * - dermatologistAgent - A flow that analyzes patient data from a dermatology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'dermatologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dr. Lucas, a world-renowned AI dermatologist.
    Your task is to analyze the provided patient data for issues related to skin, hair, and nails.
    Look for descriptions of rashes, moles, lesions, itching, hair loss, or nail changes.
    If the data is not relevant to dermatology, state "Nenhuma observação dermatológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential dermatological issues, risks, or observations based ONLY on the data provided.
    `,
});


const dermatologistAgentFlow = ai.defineFlow(
    {
      name: 'dermatologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);

export async function dermatologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await dermatologistAgentFlow(input);
}
