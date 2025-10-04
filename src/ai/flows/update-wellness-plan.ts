'use server';
/**
 * @fileOverview Service to update patient wellness plan based on all exam results
 * This is automatically triggered when a new exam is analyzed
 */

import { getAllExamsForWellnessPlan, updatePatientWellnessPlan, getPatientById } from '@/lib/db-adapter';
import { nutritionistAgent } from './nutritionist-agent';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateWellnessPlanFromExamsOutputSchema = z.object({
  dietaryPlan: z.string().describe("Detailed, actionable dietary plan based on exam findings"),
  exercisePlan: z.string().describe("Safe exercise plan suitable for patient's condition"),
  mentalWellnessPlan: z.string().describe("Stress management and mental well-being recommendations"),
  dailyReminders: z.array(z.object({
    icon: z.enum(['Droplet', 'Clock', 'Coffee', 'Bed', 'Dumbbell']),
    title: z.string(),
    description: z.string(),
  })).describe("3-4 actionable daily reminders"),
});

const wellnessPlanSynthesisPrompt = ai.definePrompt({
  name: 'wellnessPlanSynthesisPrompt',
  input: { 
    schema: z.object({
      nutritionistReport: z.string(),
      patientHistory: z.string(),
    })
  },
  output: { schema: GenerateWellnessPlanFromExamsOutputSchema },
  prompt: `You are a holistic health AI creating a comprehensive wellness plan in Brazilian Portuguese.

You received a detailed nutritionist's analysis of the patient's exam results.

**Your task:** Create 4 sections:

1. **Plano Alimentar (dietaryPlan):**
   - Specific meal suggestions and timing
   - Foods to include/increase
   - Foods to avoid/limit
   - Portion guidance
   - Hydration recommendations

2. **Plano de Exercícios (exercisePlan):**
   - Safe, appropriate exercises for their condition
   - Frequency and duration
   - Progression plan
   - Activities to avoid if relevant
   - Recovery recommendations

3. **Plano de Bem-Estar Mental (mentalWellnessPlan):**
   - Stress management techniques
   - Sleep improvement strategies
   - Mindfulness practices
   - Social connection recommendations
   - Work-life balance tips

4. **Lembretes Diários (dailyReminders):**
   - 3-4 simple, actionable daily reminders
   - **CRITICAL**: icon MUST be one of these exact values: 'Droplet', 'Clock', 'Coffee', 'Bed', 'Dumbbell'
     * Use 'Droplet' for hydration reminders
     * Use 'Clock' for timing/schedule reminders
     * Use 'Coffee' for meal/nutrition reminders
     * Use 'Bed' for sleep/rest reminders
     * Use 'Dumbbell' for exercise/movement reminders
   - Make them specific and encouraging

**Guidelines:**
- Be encouraging and positive
- Use simple, everyday Brazilian Portuguese
- Make recommendations practical and achievable
- Consider the patient's medical conditions
- Focus on gradual, sustainable changes

**Nutritionist Analysis:**
{{nutritionistReport}}

**Patient History:**
{{patientHistory}}

Return ONLY valid JSON matching the schema. No markdown, no extra text.`,
});

export async function regeneratePatientWellnessPlan(patientId: string): Promise<void> {
  try {
    console.log(`[Wellness Plan Update] Starting for patient ${patientId}`);
    
    // 1. Get patient data
    const patient = await getPatientById(patientId);
    if (!patient) {
      console.error(`[Wellness Plan Update] Patient ${patientId} not found`);
      return;
    }

    // 2. Get all exams
    const exams = await getAllExamsForWellnessPlan(patientId);
    console.log(`[Wellness Plan Update] Found ${exams.length} exams for patient ${patientId}`);

    if (exams.length === 0) {
      console.log(`[Wellness Plan Update] No exams found, skipping wellness plan update`);
      return;
    }

    // 3. Consolidate exam data
    const examSummary = exams.map((exam, index) => {
      return `
Exame ${index + 1} (${exam.date}):
- Tipo: ${exam.type}
- Diagnóstico Preliminar: ${exam.preliminaryDiagnosis}
- Explicação: ${exam.explanation}
- Sugestões: ${exam.suggestions}
${exam.results ? `- Resultados: ${exam.results.map(r => `${r.name}: ${r.value} (Ref: ${r.reference})`).join(', ')}` : ''}
      `.trim();
    }).join('\n\n---\n\n');

    const patientHistory = `
Nome: ${patient.name}
Idade: ${patient.age} anos
Gênero: ${patient.gender}
Histórico de Sintomas: ${patient.reportedSymptoms || 'Nenhum sintoma relatado'}
Histórico de Conversas: ${patient.conversationHistory || 'Nenhuma conversa registrada'}
    `.trim();

    // 4. Get nutritionist analysis
    console.log(`[Wellness Plan Update] Calling nutritionist agent...`);
    const nutritionistAnalysis = await nutritionistAgent({
      examResults: examSummary,
      patientHistory: patientHistory,
    });

    // 5. Generate comprehensive wellness plan
    console.log(`[Wellness Plan Update] Generating wellness plan...`);
    const nutritionistReport = `
**Achados Nutricionais:**
${nutritionistAnalysis.findings}

**Avaliação Clínica:**
${nutritionistAnalysis.clinicalAssessment}

**Recomendações Nutricionais:**
${nutritionistAnalysis.recommendations}
    `.trim();

    const { output } = await wellnessPlanSynthesisPrompt({
      nutritionistReport,
      patientHistory,
    });

    if (!output) {
      console.error(`[Wellness Plan Update] Failed to generate wellness plan`);
      return;
    }

    // 6. Validate and save to database
    try {
      const wellnessPlanData = {
        dietaryPlan: output.dietaryPlan,
        exercisePlan: output.exercisePlan,
        mentalWellnessPlan: output.mentalWellnessPlan,
        dailyReminders: output.dailyReminders,
        lastUpdated: new Date().toISOString(),
      };

      // Validate reminders before saving
      for (const reminder of output.dailyReminders) {
        const validIcons = ['Droplet', 'Clock', 'Coffee', 'Bed', 'Dumbbell'];
        if (!validIcons.includes(reminder.icon)) {
          console.error(`[Wellness Plan Update] VALIDATION ERROR - Invalid icon "${reminder.icon}" in reminder "${reminder.title}". Must be one of: ${validIcons.join(', ')}`);
          console.error(`[Wellness Plan Update] Full reminder data:`, JSON.stringify(reminder, null, 2));
          throw new Error(`Invalid reminder icon: ${reminder.icon}. Must be one of: ${validIcons.join(', ')}`);
        }
      }

      await updatePatientWellnessPlan(patientId, wellnessPlanData);
      console.log(`[Wellness Plan Update] ✅ Successfully updated wellness plan for patient ${patientId}`);
      console.log(`[Wellness Plan Update] Plan includes ${output.dailyReminders.length} daily reminders`);
    } catch (validationError: any) {
      console.error(`[Wellness Plan Update] ❌ VALIDATION FAILED for patient ${patientId}:`, validationError.message);
      console.error(`[Wellness Plan Update] AI Output that failed validation:`, JSON.stringify(output, null, 2));
      throw validationError; // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    console.error(`[Wellness Plan Update] ❌ CRITICAL ERROR updating wellness plan for patient ${patientId}:`, error.message || error);
    if (error.stack) {
      console.error(`[Wellness Plan Update] Stack trace:`, error.stack);
    }
    // Don't throw - we don't want to block exam analysis if wellness plan update fails
  }
}
