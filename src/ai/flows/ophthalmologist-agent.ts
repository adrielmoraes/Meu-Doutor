
'use server';
/**
 * @fileOverview An AI specialist agent for ophthalmology.
 *
 * - ophthalmologistAgent - A flow that analyzes patient data from an ophthalmology perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

export const OphthalmologistAgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history, may include vision changes, eye pain, or headaches.'),
});
export type OphthalmologistAgentInput = z.infer<typeof OphthalmologistAgentInputSchema>;

export const OphthalmologistAgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from an ophthalmology perspective. If not relevant, state that clearly."),
});
export type OphthalmologistAgentOutput = z.infer<typeof OphthalmologistAgentOutputSchema>;

const specialistPrompt = ai.definePrompt({
    name: 'ophthalmologistAgentPrompt',
    input: {schema: OphthalmologistAgentInputSchema},
    output: {schema: OphthalmologistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI ophthalmologist.
    Your task is to analyze the provided patient data for issues related to the eyes and vision.
    Look for symptoms like blurred vision, double vision, eye pain, redness, discharge, or frequent headaches.
    If the data is not relevant to ophthalmology, state "Nenhuma observação oftalmológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential ophthalmological issues, risks, or observations based ONLY on the data provided.
    `,
});

export const ophthalmologistAgent = ai.defineFlow(
  {
    name: 'ophthalmologistAgentFlow',
    inputSchema: OphthalmologistAgentInputSchema,
    outputSchema: OphthalmologistAgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
