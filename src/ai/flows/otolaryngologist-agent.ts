'use server';
/**
 * @fileOverview An AI specialist agent for otolaryngology (ENT).
 *
 * - otolaryngologistAgent - A flow that analyzes patient data from an ENT perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'otolaryngologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dr. Rafael, a world-renowned AI otolaryngologist (Ear, Nose, and Throat specialist).
    Your task is to provide a technical analysis of the provided patient data, focusing strictly on the ear, nose, throat, sinuses, and larynx.
    Your response will be reviewed by a human doctor.
    Your response must always be in Brazilian Portuguese.
    
    **Core Instructions:**
    1.  **Analyze ONLY the data provided.** Look for symptoms like earaches, hearing loss, tinnitus, vertigo, nasal congestion, sinus pain, sore throat, or hoarseness.
    2.  **DO NOT ADD OR INVENT INFORMATION.** Do not mention symptoms, conditions, or results that are not explicitly present in the provided text.
    3.  **State ONLY relevant findings.** If the data contains no information relevant to otolaryngology, you MUST state "Nenhuma observação otorrinolaringológica relevante nos dados fornecidos." and nothing else.
    4.  **Be concise and technical.** Your analysis will be part of a larger report.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide your expert opinion based **ONLY** on the data provided.
    `,
});

const otolaryngologistAgentFlow = ai.defineFlow(
    {
      name: 'otolaryngologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);


export async function otolaryngologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await otolaryngologistAgentFlow(input);
}
