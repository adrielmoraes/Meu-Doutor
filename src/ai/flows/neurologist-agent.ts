'use server';
/**
 * @fileOverview An AI specialist agent for neurology.
 *
 * - neurologistAgent - A flow that analyzes patient data from a neurology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'neurologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dr. Daniel, a world-renowned AI neurologist.
    Your task is to provide a technical analysis of the provided patient data, focusing strictly on neurological health.
    Your response will be reviewed by a human doctor.
    Your response must always be in Brazilian Portuguese.
    
    **Core Instructions:**
    1.  **Analyze ONLY the data provided.** Look for symptoms like headaches, dizziness, numbness, weakness, memory issues, seizures, or vision changes. Check exam results for findings in brain imaging (MRI, CT) or nerve conduction studies.
    2.  **DO NOT ADD OR INVENT INFORMATION.** Do not mention symptoms, conditions, or results that are not explicitly present in the provided text.
    3.  **State ONLY relevant findings.** If the data contains no information relevant to neurology, you MUST state "Nenhuma observação neurológica relevante nos dados fornecidos." and nothing else.
    4.  **Be concise and technical.** Your analysis will be part of a larger report.

    Use the medicalKnowledgeBaseTool to look up conditions, symptoms, or terms if needed to provide a more accurate analysis.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide your expert opinion based **ONLY** on the data provided.
    `,
});

const neurologistAgentFlow = ai.defineFlow(
    {
      name: 'neurologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);


export async function neurologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await neurologistAgentFlow(input);
}
