
'use server';
/**
 * @fileOverview An AI specialist agent for pediatrics.
 *
 * - pediatricianAgent - A flow that analyzes patient data from a pediatric perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './generate-preliminary-diagnosis';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './generate-preliminary-diagnosis';


const specialistPrompt = ai.definePrompt({
    name: 'pediatricianAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI pediatrician.
    Your task is to analyze the provided patient data for issues related to child health, from infants to adolescents.
    Review the patient's history, symptoms, and exam results, paying close attention to age-specific conditions and developmental milestones.
    If the patient is clearly an adult based on the history, state "Paciente é um adulto, a consulta pediátrica não é relevante."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up child-specific conditions, medications, or normal developmental ranges.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential pediatric issues, risks, or observations based ONLY on the data provided.
    `,
});

export async function pediatricianAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    const {output} = await specialistPrompt(input);
    return output!;
}
