
'use server';
/**
 * @fileOverview An AI specialist agent for gastroenterology.
 *
 * - gastroenterologistAgent - A flow that analyzes patient data from a gastroenterology perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

export const GastroenterologistAgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string, may include digestive symptoms.'),
});
export type GastroenterologistAgentInput = z.infer<typeof GastroenterologistAgentInputSchema>;

export const GastroenterologistAgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and opinions from a gastroenterology perspective. If not relevant, state that clearly."),
});
export type GastroenterologistAgentOutput = z.infer<typeof GastroenterologistAgentOutputSchema>;


const specialistPrompt = ai.definePrompt({
    name: 'gastroenterologistAgentPrompt',
    input: {schema: GastroenterologistAgentInputSchema},
    output: {schema: GastroenterologistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI gastroenterologist.
    Your task is to analyze the provided patient data for issues related to the digestive system.
    Look for symptoms like abdominal pain, nausea, vomiting, diarrhea, constipation, or heartburn.
    If the data is not relevant to gastroenterology, state "Nenhuma observação gastroenterológica específica a relatar."
    Your response must always be in Brazilian Portuguese.

    Use the medicalKnowledgeBaseTool to look up conditions or terms if needed.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of potential digestive issues, risks, or observations based ONLY on the data provided.
    `,
});

export const gastroenterologistAgent = ai.defineFlow(
  {
    name: 'gastroenterologistAgentFlow',
    inputSchema: GastroenterologistAgentInputSchema,
    outputSchema: GastroenterologistAgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
