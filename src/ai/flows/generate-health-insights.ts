'use server';
/**
 * @fileOverview An AI flow for generating preventive health insights and actionable goals.
 * REFACTORED: Fixed flow registration scope, enhanced schemas, and improved prompting.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- SCHEMAS ---

const GoalSchema = z.object({
    title: z.string().describe("A short, action-oriented title (e.g., 'Caminhar 30min diariamente')."),
    description: z.string().describe("Why this goal matters and a simple first step to achieve it."),
    category: z.enum(['exercise', 'nutrition', 'mindfulness', 'medical', 'lifestyle']).describe("The category of this goal."),
    progress: z.number().min(0).max(100).describe("Initial progress estimation. Set to 0 for new habits, or higher if patient history shows they already do this partially."),
    targetDate: z.string().describe("A suggested timeframe to review this goal (e.g., '30 dias', '3 meses')."),
});

const PreventiveAlertSchema = z.object({
    alert: z.string().describe("The preventive insight message."),
    severity: z.enum(['high', 'medium', 'low']).describe("The urgency or impact of this risk."),
    category: z.enum(['cardiovascular', 'metabolic', 'respiratory', 'general']).describe("The health domain of this alert."),
});

const GenerateHealthInsightsInputSchema = z.object({
    patientHistory: z.string().describe("Summary of patient history and lifestyle."),
    validatedDiagnosis: z.string().describe("The doctor's final validated diagnosis."),
});

const GenerateHealthInsightsOutputSchema = z.object({
    preventiveAlerts: z.array(PreventiveAlertSchema).describe("List of preventive opportunities and risks."),
    healthGoals: z.array(GoalSchema).describe("List of actionable SMART goals."),
    coachComment: z.string().describe("A brief, encouraging closing message from the AI Health Coach."),
});

export type GenerateHealthInsightsInput = z.infer<typeof GenerateHealthInsightsInputSchema>;
export type GenerateHealthInsightsOutput = z.infer<typeof GenerateHealthInsightsOutputSchema>;

// --- PROMPT DEFINITION ---

const healthInsightsPrompt = ai.definePrompt({
    name: 'generateHealthInsightsPrompt',
    model: 'googleai/gemini-2.5-flash-lite',
    input: { schema: GenerateHealthInsightsInputSchema },
    output: { schema: GenerateHealthInsightsOutputSchema },
    prompt: `You are Dr. Health, a proactive, empathetic, and scientifically grounded AI Health Coach.
    
    **MISSION:**
    Analyze the patient's data to create a preventive plan. Transform clinical diagnoses into POSITIVE, ACTIONABLE lifestyle changes.
    
    **TONE:**
    Encouraging, clear, and focused on "opportunities for improvement" rather than "scaring the patient". Use Brazilian Portuguese.

    **INPUT DATA:**
    - Patient History: {{{patientHistory}}}
    - Validated Diagnosis: {{{validatedDiagnosis}}}

    **INSTRUCTIONS:**

    1. **Preventive Alerts (Opportunities):** 
       - Identify 2-3 areas where the patient can prevent future complications.
       - Frame risks as opportunities.
       - Assign a severity level based on the clinical data.

    2. **Health Goals (SMART):**
       - Create 3 concrete, measurable goals.
       - **Progress Logic:** If the history shows the patient *already* does this, estimate progress (e.g., 20%). If it's a new habit, set to 0.
       - Include a suggested timeframe ("targetDate").

    3. **Coach Comment:**
       - Write a short (1-2 sentences) motivating closing phrase.

    Generate the JSON response below.`,
});

// --- FLOW DEFINITION (MOVED OUTSIDE FUNCTION) ---

const generateHealthInsightsFlow = ai.defineFlow(
    {
        name: 'generateHealthInsightsFlow',
        inputSchema: GenerateHealthInsightsInputSchema,
        outputSchema: GenerateHealthInsightsOutputSchema,
    },
    async (input) => {
        let attempt = 0;
        const maxAttempts = 3;

        while (attempt < maxAttempts) {
            try {
                const { output } = await healthInsightsPrompt(input);
                return output!;
            } catch (error: any) {
                const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota');

                if (isRateLimit && attempt < maxAttempts - 1) {
                    attempt++;
                    const delay = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s
                    console.warn(`[HealthCoach] ⚠️ Rate limit hit (429). Retrying in ${delay}ms... (Attempt ${attempt}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                console.error(`[HealthCoach] ❌ Error generating insights:`, error);
                throw error;
            }
        }
        throw new Error("[HealthCoach] Maximum retries exceeded");
    }
);

export async function generateHealthInsights(
    input: GenerateHealthInsightsInput
): Promise<GenerateHealthInsightsOutput> {
    return generateHealthInsightsFlow(input);
}
