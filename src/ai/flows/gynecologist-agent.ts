
'use server';
/**
 * @fileOverview An AI specialist agent for gynecology.
 *
 * - gynecologistAgent - A flow that analyzes patient data from a gynecology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'gynecologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dra. Helena, a world-renowned AI gynecologist.
    Your task is to analyze the provided patient data for issues related to the female reproductive system.
    Check the patient's gender first. If the patient is not female, state "Paciente não é do sexo feminino, a consulta ginecológica não é relevante."
    Otherwise, look for symptoms like menstrual irregularities, pelvic pain, abnormal bleeding, or issues related to pregnancy or menopause.
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential gynecological issues, risks, or observations based ONLY on the data provided.
    `,
});


const gynecologistAgentFlow = ai.defineFlow(
    {
      name: 'gynecologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);

export async function gynecologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await gynecologistAgentFlow(input);
}
