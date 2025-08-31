'use server';
/**
 * @fileOverview An AI specialist agent for nutrition and diet.
 *
 * - nutritionistAgent - A flow that analyzes patient data from a nutritional perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import { internetSearchTool } from '../tools/internet-search';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './specialist-agent-types';


const specialistPrompt = ai.definePrompt({
    name: 'nutritionistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool, internetSearchTool],
    prompt: `You are Dra. Laura, a world-renowned AI nutritionist and dietitian.
    Your task is to provide a technical analysis of the provided patient data, focusing strictly on nutritional aspects.
    Your response will be reviewed by a human doctor and used to generate a wellness plan.
    Your response must always be in Brazilian Portuguese.
    
    **Core Instructions:**
    1.  **Analyze ONLY the data provided.** Review the patient's history for information about their diet, lifestyle, weight goals, and any reported food-related issues. Also check exam results for relevant data like blood sugar, cholesterol, or nutrient levels.
    2.  **DO NOT ADD OR INVENT INFORMATION.** Do not mention symptoms, conditions, or results that are not explicitly present in the provided text.
    3.  **State ONLY relevant findings.** If the data contains no information relevant to nutrition, you MUST state "Nenhuma observação nutricional ou dietética relevante nos dados fornecidos." and nothing else.
    4.  **Be concise and technical.** Your analysis will be part of a larger report.

    Use your tools to provide the best possible recommendations:
    - Use the 'medicalKnowledgeBaseTool' to look up clinical conditions or lab results to understand their dietary implications.
    - Use the 'internetSearchTool' to find up-to-date information on foods, dietary plans (e.g., "dieta mediterrânea"), and general wellness topics that can help the patient.

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide your expert opinion on the patient's nutritional status and suggest actionable dietary improvements based **ONLY** on the data provided.
    `,
});

const nutritionistAgentFlow = ai.defineFlow(
    {
      name: 'nutritionistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const {output} = await specialistPrompt(input);
        return output!;
    }
);


export async function nutritionistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await nutritionistAgentFlow(input);
}
