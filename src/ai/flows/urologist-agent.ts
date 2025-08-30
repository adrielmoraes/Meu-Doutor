
'use server';
/**
 * @fileOverview An AI specialist agent for urology.
 *
 * - urologistAgent - A flow that analyzes patient data from a urology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'urologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are Dr. André, a world-renowned AI urologist.
    Your task is to analyze the provided patient data for issues related to the urinary tract (kidneys, bladder, ureters, urethra) and the male reproductive system.
    Look for symptoms like frequent urination, pain during urination, blood in urine, kidney stones, or, for male patients, issues like erectile dysfunction or prostate problems.
    If the data is not relevant to urology, state "Nenhuma observação urológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential urological issues, risks, or observations based ONLY on the data provided.
    `,
});


const urologistAgentFlow = ai.defineFlow(
    {
      name: 'urologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);

export async function urologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await urologistAgentFlow(input);
}
