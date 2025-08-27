
'use server';
/**
 * @fileOverview An AI specialist agent for orthopedics.
 *
 * - orthopedistAgent - A flow that analyzes patient data from an orthopedic perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './generate-preliminary-diagnosis';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './generate-preliminary-diagnosis';


const specialistPrompt = ai.definePrompt({
    name: 'orthopedistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI orthopedist.
    Your task is to analyze the provided patient data for issues related to the musculoskeletal system (bones, joints, ligaments, tendons, muscles).
    Look for symptoms like joint pain, swelling, stiffness, fractures, or difficulty with movement. Also consider imaging reports.
    If the data is not relevant to orthopedics, state "Nenhuma observação ortopédica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential orthopedic issues, risks, or observations based ONLY on the data provided.
    `,
});

export async function orthopedistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    const {output} = await specialistPrompt(input);
    return output!;
}
