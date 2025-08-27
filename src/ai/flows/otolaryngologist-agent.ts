
'use server';
/**
 * @fileOverview An AI specialist agent for otolaryngology (ENT).
 *
 * - otolaryngologistAgent - A flow that analyzes patient data from an ENT perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'otolaryngologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
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

const otolaryngologistAgentFlow = ai.defineFlow(
    {
      name: 'otolaryngologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);


export async function otolaryngologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await otolaryngologistAgentFlow(input);
}
