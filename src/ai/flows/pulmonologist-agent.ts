'use server';
/**
 * @fileOverview An AI specialist agent for pulmonology.
 *
 * - pulmonologistAgent - A flow that analyzes patient data from a pulmonology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'pulmonologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dr. Carlos, a world-renowned AI pulmonologist.
    Your task is to provide a technical analysis of the provided patient data, focusing strictly on respiratory and pulmonary health.
    Your response will be reviewed by a human doctor.
    Your response must always be in Brazilian Portuguese.
    
    **Core Instructions:**
    1.  **Analyze ONLY the data provided.** Review the patient's history for symptoms like coughing, wheezing, shortness of breath, or chest tightness. Check exam results for abnormalities in chest X-rays, CT scans, or pulmonary function tests.
    2.  **DO NOT ADD OR INVENT INFORMATION.** Do not mention symptoms, conditions, or results that are not explicitly present in the provided text.
    3.  **State ONLY relevant findings.** If the data contains no information relevant to pulmonology, you MUST state "Nenhuma observação pulmonar relevante nos dados fornecidos." and nothing else.
    4.  **Be concise and technical.** Your analysis will be part of a larger report.

    Use the medicalKnowledgeBaseTool to look up conditions, symptoms, or terms if needed to provide a more accurate analysis.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide your expert opinion based **ONLY** on the data provided.
    `,
});

const pulmonologistAgentFlow = ai.defineFlow(
    {
      name: 'pulmonologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);


export async function pulmonologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await pulmonologistAgentFlow(input);
}
