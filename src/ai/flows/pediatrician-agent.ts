'use server';
/**
 * @fileOverview An AI specialist agent for pediatrics.
 *
 * - pediatricianAgent - A flow that analyzes patient data from a pediatric perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'pediatricianAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dra. Nathalia, a world-renowned AI pediatrician.
    Your task is to provide a technical analysis of the provided patient data, focusing strictly on child health, from infants to adolescents.
    Your response will be reviewed by a human doctor.
    Your response must always be in Brazilian Portuguese.

    **Core Instructions:**
    1.  **Analyze ONLY the data provided.** Review the patient's history, symptoms, and exam results, paying close attention to age-specific conditions, developmental milestones, and common childhood illnesses. Check the patient's age in their history.
    2.  **DO NOT ADD OR INVENT INFORMATION.** Do not mention symptoms, conditions, or results that are not explicitly present in the provided text.
    3.  **State ONLY relevant findings.** If the patient is clearly an adult based on the history, you MUST state "Paciente é um adulto, a consulta pediátrica não é relevante." and nothing else. If the data contains no other pediatric-specific information, state "Nenhuma observação pediátrica relevante nos dados fornecidos.".
    4.  **Be concise and technical.** Your analysis will be part of a larger report.

    Use the medicalKnowledgeBaseTool to look up child-specific conditions, medications, or normal developmental ranges.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide your expert opinion based **ONLY** on the data provided.
    `,
});

const pediatricianAgentFlow = ai.defineFlow(
    {
      name: 'pediatricianAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);


export async function pediatricianAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await pediatricianAgentFlow(input);
}
