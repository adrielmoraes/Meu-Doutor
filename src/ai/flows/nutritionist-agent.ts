'use server';
/**
 * @fileOverview An AI specialist agent for nutrition and diet.
 *
 * - nutritionistAgent - A flow that analyzes patient data from a nutritional perspective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';

const AgentInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams, which may contain data like cholesterol levels, vitamin deficiencies, or glucose.'),
  patientHistory: z
    .string()
    .describe('The patient medical history, may include dietary habits, weight management goals, or food allergies.'),
});

const AgentOutputSchema = z.object({
    findings: z.string().describe("The specialist's findings and dietary recommendations. If not relevant, state that dietary information was not provided."),
});

const specialistPrompt = ai.definePrompt({
    name: 'nutritionistAgentPrompt',
    input: {schema: AgentInputSchema},
    output: {schema: AgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: `You are a world-renowned AI nutritionist and dietitian.
    Your task is to analyze the provided patient data to provide dietary advice and recommendations.
    Review the patient's history for information about their diet, lifestyle, weight goals, and any reported food-related issues. Also check exam results for relevant data like blood sugar, cholesterol, or nutrient levels.
    If no dietary information is provided, state "No specific nutritional or dietary findings to report."

    Use the medicalKnowledgeBaseTool to look up food properties, vitamins, or diet-related conditions.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of the patient's nutritional status and suggest actionable dietary improvements.
    `,
});

export const nutritionistAgent = ai.defineFlow(
  {
    name: 'nutritionistAgentFlow',
    inputSchema: AgentInputSchema,
    outputSchema: AgentOutputSchema,
  },
  async input => {
    const {output} = await specialistPrompt(input);
    return output!;
  }
);
