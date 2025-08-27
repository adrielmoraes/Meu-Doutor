
'use server';
/**
 * @fileOverview An AI specialist agent for radiology.
 *
 * - radiologistAgent - A flow that analyzes patient data from a radiology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './generate-preliminary-diagnosis';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './generate-preliminary-diagnosis';


const specialistPrompt = ai.definePrompt({
    name: 'radiologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI radiologist.
    Your task is to analyze the provided patient data, looking specifically for reports from imaging exams (like X-Rays, CT Scans, MRIs) within the 'examResults' text.
    If no imaging reports are present, state "Nenhum dado radiológico para analisar."
    Your response must always be in Brazilian Portuguese.

    If imaging reports are found, provide your expert interpretation. Use the medicalKnowledgeBaseTool to clarify terms if necessary.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise interpretation of any imaging findings. Do not comment on other aspects of the patient's health.
    `,
});

export async function radiologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    const {output} = await specialistPrompt(input);
    return output!;
}
