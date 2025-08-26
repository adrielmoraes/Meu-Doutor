
'use server';
/**
 * @fileOverview An AI specialist agent for pediatrics.
 *
 * - pediatricianAgent - A flow that analyzes patient data from a pediatric perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

export const PediatricianAgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history. Pay close attention to the patient age.'),
});
export type PediatricianAgentInput = z.infer<typeof PediatricianAgentInputSchema>;

export const PediatricianAgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from a pediatric perspective. If the patient is an adult, state that clearly."),
});
export type PediatricianAgentOutput = z.infer<typeof PediatricianAgentOutputSchema>;

const specialistPrompt = ai.definePrompt({
    name: 'pediatricianAgentPrompt',
    input: {schema: PediatricianAgentInputSchema},
    output: {schema: PediatricianAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI pediatrician.
    Your task is to analyze the provided patient data for issues related to child health, from infants to adolescents.
    Review the patient's history, symptoms, and exam results, paying close attention to age-specific conditions and developmental milestones.
    If the patient is clearly an adult based on the history, state "Paciente é um adulto, a consulta pediátrica não é relevante."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up child-specific conditions, medications, or normal developmental ranges.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential pediatric issues, risks, or observations based ONLY on the data provided.
    `,
});

export const pediatricianAgent = ai.defineFlow(
  {
    name: 'pediatricianAgentFlow',
    inputSchema: PediatricianAgentInputSchema,
    outputSchema: PediatricianAgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
