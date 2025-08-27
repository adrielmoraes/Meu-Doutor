
'use server';
/**
 * @fileOverview An AI specialist agent for gastroenterology.
 *
 * - gastroenterologistAgent - A flow that analyzes patient data from a gastroenterology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './generate-preliminary-diagnosis';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './generate-preliminary-diagnosis';


const specialistPrompt = ai.definePrompt({
    name: 'gastroenterologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI gastroenterologist.
    Your task is to analyze the provided patient data for issues related to the digestive system.
    Look for symptoms like abdominal pain, nausea, vomiting, diarrhea, constipation, or heartburn.
    If the data is not relevant to gastroenterology, state "Nenhuma observação gastroenterológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential digestive issues, risks, or observations based ONLY on the data provided.
    `,
});

export async function gastroenterologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    const {output} = await specialistPrompt(input);
    return output!;
}
