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
    Your task is to provide a technical analysis of the provided patient data, focusing strictly on the female reproductive system.
    Your response will be reviewed by a human doctor.
    Your response must always be in Brazilian Portuguese.
    
    **Core Instructions:**
    1.  **Analyze ONLY the data provided.** Check the patient's gender first. If the patient is not female, state "Paciente não é do sexo feminino, a consulta ginecológica não é relevante." and nothing else. Otherwise, look for symptoms like menstrual irregularities, pelvic pain, abnormal bleeding, or issues related to pregnancy or menopause.
    2.  **DO NOT ADD OR INVENT INFORMATION.** Do not mention symptoms, conditions, or results that are not explicitly present in the provided text.
    3.  **State ONLY relevant findings.** If the data is not relevant to gynecology (and the patient is female), you MUST state "Nenhuma observação ginecológica relevante nos dados fornecidos." and nothing else.
    4.  **Be concise and technical.** Your analysis will be part of a larger report.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide your expert opinion based **ONLY** on the data provided.
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
