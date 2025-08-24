
'use server';
/**
 * @fileOverview An AI specialist agent for cardiology.
 *
 * - cardiologistAgent - A flow that analyzes patient data from a cardiology perspective.
 * - CardiologistAgentInput - The input type for the flow.
 * - CardiologistAgentOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

// Input is the same as the main diagnosis flow, as it receives the same data
const CardiologistAgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string.'),
});
export type CardiologistAgentInput = z.infer<typeof CardiologistAgentInputSchema>;

const CardiologistAgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from a cardiology perspective. If not relevant, state that clearly."),
});
export type CardiologistAgentOutput = z.infer<typeof CardiologistAgentOutputSchema>;

const specialistPrompt = ai.definePrompt({
    name: 'cardiologistAgentPrompt',
    input: {schema: CardiologistAgentInputSchema},
    output: {schema: CardiologistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI cardiologist.
    Your task is to analyze the provided patient data and provide your expert opinion focusing specifically on cardiovascular health.
    If the data is not relevant to cardiology, state "Nenhuma observação cardiológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions, symptoms, or terms if needed to provide a more accurate analysis.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential cardiological issues, risks, or observations based ONLY on the data provided. Your findings will be used by a General Practitioner AI to form a complete diagnosis.
    `,
});

export const cardiologistAgent = ai.defineFlow(
  {
    name: 'cardiologistAgentFlow',
    inputSchema: CardiologistAgentInputSchema,
    outputSchema: CardiologistAgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
