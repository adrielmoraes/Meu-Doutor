
'use server';
/**
 * @fileOverview An AI specialist agent for nutrition and diet.
 *
 * - nutritionistAgent - A flow that analyzes patient data from a nutritional perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import { internetSearchTool } from '../tools/internet-search';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './generate-preliminary-diagnosis';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema } from './generate-preliminary-diagnosis';


const specialistPrompt = ai.definePrompt({
    name: 'nutritionistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool, internetSearchTool],
    prompt: `You are a world-renowned AI nutritionist and dietitian.
    Your task is to analyze the provided patient data to provide dietary advice and recommendations.
    Review the patient's history for information about their diet, lifestyle, weight goals, and any reported food-related issues. Also check exam results for relevant data like blood sugar, cholesterol, or nutrient levels.
    Your response must always be in Brazilian Portuguese.
    
    Use your tools to provide the best possible recommendations:
    - Use the 'medicalKnowledgeBaseTool' to look up clinical conditions or lab results.
    - Use the 'internetSearchTool' to find up-to-date information on foods, dietary plans (e.g., "dieta mediterrânea"), and general wellness topics.

    If no dietary information is provided, state "Nenhuma observação nutricional ou dietética específica a relatar."

    Patient's exam results:
    {{examResults}}

    Patient's history and symptoms summary:
    {{patientHistory}}

    Provide a concise analysis of the patient's nutritional status and suggest actionable dietary improvements based on your research.
    `,
});

export async function nutritionistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    const {output} = await specialistPrompt(input);
    return output!;
}
