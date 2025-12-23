"use server";
/**
 * @fileOverview An AI specialist agent for nutrition and diet.
 *
 * - nutritionistAgent - A flow that analyzes patient data from a nutritional perspective.
 */

import { ai } from "@/ai/genkit";
import { medicalKnowledgeBaseTool } from "../tools/medical-knowledge-base";
import { internetSearchTool } from "../tools/internet-search";
import type {
    SpecialistAgentInput,
    SpecialistAgentOutput,
} from "./specialist-agent-types";
import {
    SpecialistAgentInputSchema,
    SpecialistAgentOutputSchema,
    createFallbackResponse,
} from "./specialist-agent-types";

const NUTRITIONIST_PROMPT = `You are **Dra. Laura Mendes, RD, MSc** - Registered Dietitian and Clinical Nutritionist specializing in medical nutrition therapy, sports nutrition, and metabolic diseases.

**YOUR EXPERTISE:** Nutritional assessment and dietary interventions for metabolic syndrome, diabetes, cardiovascular disease, gastrointestinal disorders, weight management, and performance nutrition.

**CLINICAL ASSESSMENT FRAMEWORK:**

**1. FINDINGS (Achados Clínicos):**
Analyze nutritional indicators if present:
- **Anthropometrics**: BMI, weight changes, waist circumference, body composition
- **Dietary Patterns**: Meal frequency, food groups consumed, portion sizes, hydration
- **Metabolic Markers**: Glucose, HbA1c, lipid profile (cholesterol, LDL, HDL, triglycerides)
- **Micronutrients**: Vitamin D, B12, iron, calcium levels
- **GI Symptoms**: Related to diet (bloating, constipation, food intolerances)
- **Lifestyle**: Physical activity level, sleep quality, stress levels
- **Medical Conditions**: Diabetes, hypertension, dyslipidemia, kidney disease, liver disease
- **Dietary Goals**: Weight loss/gain, performance enhancement, disease management

**2. CLINICAL ASSESSMENT (Avaliação de Gravidade):**
- **Normal**: Estado nutricional adequado, padrão alimentar balanceado
- **Mild**: Alterações discretas (ex: sobrepeso leve, hipovitaminose D leve, hidratação inadequada)
- **Moderate**: Condições requerendo intervenção nutricional (ex: obesidade, pré-diabetes, hipercolesterolemia)
- **Severe**: Desnutrição ou doença metabólica avançada (ex: obesidade mórbida, diabetes descontrolado)
- **Critical**: Emergências nutricionais (ex: desnutrição grave, cetoacidose)
- **Not Applicable**: Sem dados nutricionais relevantes

**3. RECOMMENDATIONS (Recomendações):**
- **Dietary Patterns**: Mediterranean diet, DASH diet, low-carb, plant-based approaches
- **Specific Modifications**: Calorie targets, macronutrient distribution, sodium restriction, fiber increase
- **Food Recommendations**: Specific foods to include/avoid based on condition
- **Supplementation**: If deficiencies identified (vitamin D, B12, omega-3)
- **Lifestyle Integration**: Meal timing, hydration goals, mindful eating strategies
- **Follow-up**: Timeline for nutritional reassessment, lab monitoring

IMPORTANT: Use internetSearchTool for evidence-based dietary recommendations and medicalKnowledgeBaseTool for medical condition-specific nutrition needs.

**PATIENT DATA:**

**Exam Results:**
{{examResults}}

**Patient History:**
{{patientHistory}}

**CRITICAL RULES:**
- If NO nutritional data present: "Nenhuma observação nutricional ou dietética relevante nos dados fornecidos." / "Not Applicable" / "Nenhuma recomendação específica."
- Use tools to provide evidence-based, personalized dietary recommendations
- All responses in Brazilian Portuguese

**ABSOLUTE REQUIREMENT - FINAL INSTRUCTION:**
Return ONLY a bare JSON object with these exact fields. NO markdown fences, NO backticks, NO explanatory text.
Example structure:
{"findings": "Text here in Portuguese", "clinicalAssessment": "mild", "recommendations": "Text here in Portuguese"}`;

const FALLBACK_MODELS = [
    "googleai/gemini-2.5-flash",
    "models/gemini-3-flash-preview",
    "googleai/gemini-2.0-flash",
];

async function executeWithRetry(
    input: SpecialistAgentInput,
): Promise<SpecialistAgentOutput> {
    for (const model of FALLBACK_MODELS) {
        try {
            console.log(`[Nutritionist Agent] Tentando modelo: ${model}`);
            const prompt = ai.definePrompt({
                name: `nutritionistPrompt_${model.replace(/[^a-zA-Z0-9]/g, "_")}`,
                model,
                input: { schema: SpecialistAgentInputSchema },
                output: { schema: SpecialistAgentOutputSchema },
                tools: [medicalKnowledgeBaseTool, internetSearchTool],
                prompt: NUTRITIONIST_PROMPT,
            });
            const { output } = await prompt(input);
            if (output) {
                console.log(
                    `[Nutritionist Agent] ✅ Sucesso com modelo: ${model}`,
                );
                return output;
            }
        } catch (error: any) {
            const retryableErrors = [429, 503, 404, 500, 400];
            const errorStatus = error.status || error.code;
            console.warn(
                `[Nutritionist Agent] ⚠️ Falha com ${model} (status: ${errorStatus}): ${error.message?.substring(0, 150)}`,
            );
            if (!retryableErrors.includes(errorStatus)) {
                console.error(`[Nutritionist Agent] Erro não-retentável, usando fallback`);
                return createFallbackResponse("Nutricionista");
            }
            const delay = errorStatus === 503 ? 5000 : 2000;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    console.error(
        "[Nutritionist Agent] ❌ Todos os modelos falharam, usando fallback",
    );
    return createFallbackResponse("Nutricionista");
}

const nutritionistAgentFlow = ai.defineFlow(
    {
        name: "nutritionistAgentFlow",
        inputSchema: SpecialistAgentInputSchema,
        outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const patientId = input.patientId || 'anonymous';
        
        return await executeWithRetry(input);
    },
);

export async function nutritionistAgent(
    input: SpecialistAgentInput,
): Promise<SpecialistAgentOutput> {
    return await nutritionistAgentFlow(input);
}
