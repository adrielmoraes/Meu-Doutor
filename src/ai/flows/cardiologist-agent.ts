
'use server';
/**
 * @fileOverview An AI specialist agent for cardiology.
 *
 * - cardiologistAgent - A flow that analyzes patient data from a cardiology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'cardiologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI cardiologist.
    Your task is to analyze the provided patient data and provide your expert opinion focusing specifically on cardiovascular health.
    If the data is not relevant to cardiology, state "Nenhuma observação cardiológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions, symptoms, or terms if needed to provide a more accurate analysis.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential cardiological issues, risks, or observations based ONLY on the data provided. Your findings will be used by a General Practitioner AI to form a complete diagnosis.
    `,
});

const cardiologistAgentFlow = ai.defineFlow(
    {
      name: 'cardiologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);


export async function cardiologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await cardiologistAgentFlow(input);
}
