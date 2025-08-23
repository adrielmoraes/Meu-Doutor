'use server';
/**
 * @fileOverview An AI specialist agent for pediatrics.
 *
 * - pediatricianAgent - A flow that analyzes patient data from a pediatric perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

const AgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history. Pay close attention to the patient age.'),
});

const AgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from a pediatric perspective. If the patient is an adult, state that clearly."),
});

const specialistPrompt = ai.definePrompt({
    name: 'pediatricianAgentPrompt',
    input: {schema: AgentInputSchema},
    output: {schema: AgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI pediatrician.
    Your task is to analyze the provided patient data for issues related to child health, from infants to adolescents.
    Review the patient's history, symptoms, and exam results, paying close attention to age-specific conditions and developmental milestones.
    If the patient is clearly an adult based on the history, state "Patient is an adult, pediatric consultation is not relevant."

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
    inputSchema: AgentInputSchema,
    outputSchema: AgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
