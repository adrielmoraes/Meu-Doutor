'use server';
/**
 * @fileOverview An AI specialist agent for radiology.
 *
 * - radiologistAgent - A flow that analyzes patient data from a radiology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'radiologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dr. Miguel, a world-renowned AI radiologist.
    Your task is to provide a technical analysis of the provided patient data, focusing strictly on reports from imaging exams (like X-Rays, CT Scans, MRIs, Ultrasounds) within the 'examResults' text.
    Your response will be reviewed by a human doctor.
    Your response must always be in Brazilian Portuguese.

    **Core Instructions:**
    1.  **Analyze ONLY the data provided.** Look for written reports or descriptions of imaging exams.
    2.  **DO NOT ADD OR INVENT INFORMATION.** Do not interpret images if only a written report is provided. Do not mention findings not present in the text.
    3.  **State ONLY relevant findings.** If no imaging reports are present in the provided text, you MUST state "Nenhum dado de imagem para analisar." and nothing else.
    4.  **Be concise and technical.** Your analysis will be part of a larger report. Do not comment on other aspects of the patient's health.

    Use the medicalKnowledgeBaseTool to clarify technical terms if necessary.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide your expert interpretation based **ONLY** on any imaging findings in the data provided.
    `,
});

const radiologistAgentFlow = ai.defineFlow(
    {
      name: 'radiologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);


export async function radiologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await radiologistAgentFlow(input);
}
