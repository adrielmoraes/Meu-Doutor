'use server';
/**
 * @fileOverview Service to update patient wellness plan based on all exam results
 * This is automatically triggered when a new exam is analyzed
 */

import { getAllExamsForWellnessPlan, updatePatientWellnessPlan, getPatientById } from '@/lib/db-adapter';
import { nutritionistAgent } from './nutritionist-agent';
import { generateHealthInsights } from './generate-health-insights';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { trackWellnessPlan } from '@/lib/usage-tracker';
import { countTextTokens } from '@/lib/token-counter';
import { generateWithFallback } from '@/lib/ai-resilience';

const RecipeSchema = z.object({
  title: z.string().describe("Nome da receita"),
  ingredients: z.array(z.string()).describe("Lista de ingredientes com quantidades"),
  instructions: z.string().describe("Modo de preparo passo a passo"),
  prepTime: z.string().describe("Tempo de preparo (ex: '20 minutos')"),
});

const MealPrepSuggestionSchema = z.object({
  day: z.string().describe("Day of the week in Portuguese (e.g., Segunda-feira)."),
  breakfast: z.string().describe("Brief breakfast description."),
  breakfastRecipe: RecipeSchema.optional().describe("Receita detalhada do café da manhã"),
  lunch: z.string().describe("Brief lunch description."),
  lunchRecipe: RecipeSchema.optional().describe("Receita detalhada do almoço"),
  dinner: z.string().describe("Brief dinner description."),
  dinnerRecipe: RecipeSchema.optional().describe("Receita detalhada do jantar"),
  snacks: z.string().optional().describe("Optional healthy snack suggestions.")
});

const GenerateWellnessPlanFromExamsOutputSchema = z.object({
  dietaryPlan: z.string().describe("Detailed, actionable dietary plan based on exam findings"),
  exercisePlan: z.string().describe("Safe exercise plan suitable for patient's condition"),
  mentalWellnessPlan: z.string().describe("Stress management and mental well-being recommendations"),
  dailyReminders: z.array(z.object({
    icon: z.enum(['Droplet', 'Clock', 'Coffee', 'Bed', 'Dumbbell']),
    title: z.string(),
    description: z.string(),
  })).describe("3-4 actionable daily reminders"),
  weeklyMealPlan: z.array(MealPrepSuggestionSchema).describe("7 detailed meal suggestions, one for each day of the week"),
  weeklyTasks: z.array(z.object({
    id: z.string().describe("Unique ID for the task (use format: task-1, task-2, etc)"),
    category: z.enum(['nutrition', 'exercise', 'mental', 'general']),
    title: z.string().describe("Clear, actionable task title"),
    description: z.string().describe("Brief description of what to do"),
    dayOfWeek: z.string().optional().describe("Suggested day (Segunda, Terça, Quarta, etc) or leave empty for any day"),
    completed: z.boolean().default(false),
    completedAt: z.string().optional(),
  })).describe("7-10 specific weekly tasks organized by category"),
});

const wellnessPlanSynthesisPrompt = ai.definePrompt({
  name: 'wellnessPlanSynthesisPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  input: {
    schema: z.object({
      nutritionistReport: z.string(),
      patientHistory: z.string(),
    })
  },
  output: { schema: GenerateWellnessPlanFromExamsOutputSchema },
  prompt: `You are a holistic health AI creating a comprehensive wellness plan in Brazilian Portuguese.

You received a detailed nutritionist's analysis of the patient's exam results.

**Your task:** Create 6 sections:

1. **Plano Alimentar (dietaryPlan):**
   - **MANDATORY**: Cite specific values from the exams (e.g., "Seu colesterol total é X, então...").
   - Specific meal suggestions and timing
   - Foods to include/increase
   - Foods to avoid/limit
   - Portion guidance
   - Hydration recommendations
   - **FORMATTING RULES**: 
     - Use proper Markdown.
     - ALWAYS put a blank line before **Bold Headers**.
     - ALWAYS put a blank line before list items.

2. **Plano de Exercícios (exercisePlan):**
   - **MANDATORY**: Reference patient's physical conditions/exams (e.g., "Devido à condromalácia...").
   - Safe, appropriate exercises for their condition
   - Frequency and duration
   - Progression plan
   - Activities to avoid if relevant
   - Recovery recommendations
   - **FORMATTING RULES**: Same as above. Blank lines before headers/lists.

3. **Plano de Bem-Estar Mental (mentalWellnessPlan):**
   - Stress management techniques
   - Sleep improvement strategies
   - Mindfulness practices
   - Social connection recommendations
   - Work-life balance tips
   - **FORMATTING RULES**: Same as above. Blank lines before headers/lists.

4. **Lembretes Diários (dailyReminders):**
   - 3-4 simple, actionable daily reminders
   - **CRITICAL**: icon MUST be one of these exact values: 'Droplet', 'Clock', 'Coffee', 'Bed', 'Dumbbell'
     * Use 'Droplet' for hydration reminders
     * Use 'Clock' for timing/schedule reminders
     * Use 'Coffee' for meal/nutrition reminders
     * Use 'Bed' for sleep/rest reminders
     * Use 'Dumbbell' for exercise/movement reminders
   - Make them specific and encouraging

5. **Plano Semanal de Refeições (weeklyMealPlan):**
   - Crie um plano para 7 dias (Segunda a Domingo)
   - Para cada dia, forneça:
     * **Descrição breve** da refeição (breakfast, lunch, dinner)
     * **Receita detalhada** com ingredientes e modo de preparo (breakfastRecipe, lunchRecipe, dinnerRecipe)
     * Lanches saudáveis (opcional)
   - Seja criativo mas prático - use alimentos acessíveis
   - Varie as opções ao longo da semana
   - Baseie-se nas recomendações nutricionais fornecidas

**Exemplo de estrutura para um dia:**
\`\`\`json
{
  "day": "Segunda-feira",
  "breakfast": "Mingau de aveia com frutas",
  "breakfastRecipe": {
    "title": "Mingau de Aveia com Banana e Mel",
    "ingredients": [
      "1 xícara de aveia em flocos",
      "2 xícaras de leite desnatado",
      "1 banana madura",
      "1 colher de sopa de mel",
      "Canela em pó a gosto"
    ],
    "instructions": "1. Aqueça o leite em fogo médio\\n2. Adicione a aveia e mexa constantemente por 5-7 minutos\\n3. Quando engrossar, desligue o fogo\\n4. Adicione mel e canela\\n5. Sirva com rodelas de banana por cima",
    "prepTime": "15 minutos"
  },
  "lunch": "Frango grelhado com arroz integral e salada",
  "lunchRecipe": {
    "title": "Frango Grelhado com Legumes",
    "ingredients": [
      "120g de peito de frango",
      "4 colheres de arroz integral cozido",
      "2 colheres de feijão",
      "Alface, tomate, cenoura ralada",
      "Azeite extravirgem e limão"
    ],
    "instructions": "1. Tempere o frango com sal, alho e limão\\n2. Grelhe por 8-10 minutos de cada lado\\n3. Monte o prato com arroz, feijão e salada\\n4. Regue a salada com azeite e limão",
    "prepTime": "25 minutos"
  },
  "dinner": "Salmão com batata doce",
  "snacks": "1 maçã + 10 amêndoas"
}
\`\`\`

6. **Tarefas Semanais (weeklyTasks):**
   - Create 7-10 specific, achievable tasks for the week
   - Distribute tasks across categories: 'nutrition', 'exercise', 'mental', 'general'
   - **IMPORTANT**: DO NOT create tasks to prepare recipes - recipes are shown separately
   - Each task must have:
     * **id**: Use format "task-1", "task-2", etc (sequential numbering)
     * **category**: Choose from 'nutrition', 'exercise', 'mental', 'general'
     * **title**: Clear, action-oriented title (e.g., "Caminhar 30 minutos", "Beber 2L de água")
     * **description**: Brief explanation of the task
     * **dayOfWeek**: (Optional) ONE SINGLE DAY like "Segunda-feira" or "Domingo" or leave empty - NEVER use multiple days separated by |
     * **completed**: Always set to false (patient will mark as done)
     * **completedAt**: Leave empty
   - Make tasks specific, measurable, and achievable
   - Balance tasks across the week
   - For nutrition category, focus on habits, NOT recipe preparation (e.g., "Planejar refeições", "Fazer lista de compras")
   - Examples:
     * {id: "task-1", category: "nutrition", title: "Planejar cardápio da semana", description: "Reserve 20 minutos para planejar refeições balanceadas", dayOfWeek: "Domingo", completed: false}
     * {id: "task-2", category: "exercise", title: "Caminhar 30 minutos", description: "Caminhada leve ao ar livre ou esteira", dayOfWeek: "Segunda-feira", completed: false}
     * {id: "task-3", category: "mental", title: "Meditação guiada", description: "10 minutos de meditação ou respiração profunda", dayOfWeek: "Quarta", completed: false}

**Guidelines:**
- Be encouraging and positive
- Use simple, everyday Brazilian Portuguese
- Make recommendations practical and achievable
- Consider the patient's medical conditions
- Focus on gradual, sustainable changes
- **STRICT MARKDOWN RULES**:
  - Never put list items on the same line as the header.
  - Always add a blank line before starting a list.
  - Always add a blank line before **Bold Text**.

**Nutritionist Analysis:**
{{nutritionistReport}}

**Patient History:**
{{patientHistory}}

Return ONLY valid JSON matching the schema. No markdown in the JSON wrapper, no extra text.`,
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

    // Track nutritionist agent LLM usage
    const nutritionistInputText = [examSummary, patientHistory].filter(Boolean).join('\n\n');
    const nutritionistOutputText = [
      nutritionistAnalysis.findings || '',
      (nutritionistAnalysis as any).clinicalAssessment || '',
      nutritionistAnalysis.recommendations || ''
    ].filter(Boolean).join('\n\n');
    const nutritionistInputTokens = countTextTokens(nutritionistInputText);
    const nutritionistOutputTokens = countTextTokens(nutritionistOutputText);
    trackWellnessPlan(patientId, nutritionistInputTokens, nutritionistOutputTokens, 'gemini-2.5-flash')
      .catch(err => console.error('[Wellness Plan Update] Nutritionist tracking error:', err));

    // 4.5. Generate Health Insights (Coach Comment, Goals, Alerts)
    console.log(`[Wellness Plan Update] Generating health insights...`);
    const healthInsights = await generateHealthInsights({
      patientHistory: patientHistory,
      validatedDiagnosis: examSummary,
    });

    console.log(`[Wellness Plan Update] Health insights generated:`, {
      hasCoachComment: !!healthInsights.coachComment,
      goalsCount: healthInsights.healthGoals?.length || 0,
      alertsCount: healthInsights.preventiveAlerts?.length || 0,
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

    const { output } = await generateWithFallback({
      prompt: wellnessPlanSynthesisPrompt,
      input: {
        nutritionistReport,
        patientHistory,
      }
    });

    // Track wellness plan synthesis LLM usage
    const synthesisInputText = [nutritionistReport, patientHistory].filter(Boolean).join('\n\n');
    const synthesisInputTokens = countTextTokens(synthesisInputText);
    const synthesisOutputTokens = countTextTokens(JSON.stringify(output || {}));
    trackWellnessPlan(patientId, synthesisInputTokens, synthesisOutputTokens, 'gemini-2.5-flash-lite')
      .catch(err => console.error('[Wellness Plan Update] Synthesis tracking error:', err));

    if (!output) {
      console.error(`[Wellness Plan Update] Failed to generate wellness plan`);
      return;
    }

    console.log(`[Wellness Plan Update] AI Output received:`, JSON.stringify({
      hasRecipes: !!output.weeklyMealPlan,
      recipeCount: output.weeklyMealPlan?.length || 0,
      taskCount: output.weeklyTasks?.length || 0,
      reminderCount: output.dailyReminders?.length || 0
    }));

    // 6. Validate and save to database
    try {
      // Validate reminders before saving
      for (const reminder of output.dailyReminders) {
        const validIcons = ['Droplet', 'Clock', 'Coffee', 'Bed', 'Dumbbell',
          'Apple', 'Heart', 'Sun', 'Moon', 'Activity',
          'Utensils', 'Brain', 'Smile', 'Wind', 'Leaf'];
        if (!validIcons.includes(reminder.icon)) {
          console.error(`[Wellness Plan Update] VALIDATION ERROR - Invalid icon "${reminder.icon}" in reminder "${reminder.title}". Must be one of: ${validIcons.join(', ')}`);
          console.error(`[Wellness Plan Update] Full reminder data:`, JSON.stringify(reminder, null, 2));
          throw new Error(`Invalid reminder icon: ${reminder.icon}. Must be one of: ${validIcons.join(', ')}`);
        }
      }

      // Validate weekly meal plan before saving
      for (const meal of output.weeklyMealPlan) {
        if (meal.breakfastRecipe && (meal.breakfastRecipe.prepTime.toLowerCase().includes('minute') || meal.breakfastRecipe.prepTime.toLowerCase().includes('minuto'))) {
          // Continue if prepTime is valid
        } else if (meal.breakfastRecipe) {
          console.error(`[Wellness Plan Update] VALIDATION ERROR - Invalid prepTime format "${meal.breakfastRecipe.prepTime}" in recipe "${meal.breakfastRecipe.title}" for day ${meal.day}. Expected format like '20 minutos' or '20 minutes'.`);
          throw new Error(`Invalid prepTime format in recipe: ${meal.breakfastRecipe.prepTime}`);
        }

        if (meal.lunchRecipe && (meal.lunchRecipe.prepTime.toLowerCase().includes('minute') || meal.lunchRecipe.prepTime.toLowerCase().includes('minuto'))) {
          // Continue if prepTime is valid
        } else if (meal.lunchRecipe) {
          console.error(`[Wellness Plan Update] VALIDATION ERROR - Invalid prepTime format "${meal.lunchRecipe.prepTime}" in recipe "${meal.lunchRecipe.title}" for day ${meal.day}. Expected format like '20 minutos' or '20 minutes'.`);
          throw new Error(`Invalid prepTime format in recipe: ${meal.lunchRecipe.prepTime}`);
        }

        if (meal.dinnerRecipe && (meal.dinnerRecipe.prepTime.toLowerCase().includes('minute') || meal.dinnerRecipe.prepTime.toLowerCase().includes('minuto'))) {
          // Continue if prepTime is valid
        } else if (meal.dinnerRecipe) {
          console.error(`[Wellness Plan Update] VALIDATION ERROR - Invalid prepTime format "${meal.dinnerRecipe.prepTime}" in recipe "${meal.dinnerRecipe.title}" for day ${meal.day}. Expected format like '20 minutos' or '20 minutes'.`);
          throw new Error(`Invalid prepTime format in recipe: ${meal.dinnerRecipe.prepTime}`);
        }
      }

      // Validate weekly tasks before saving
      for (const task of output.weeklyTasks) {
        const validCategories = ['nutrition', 'exercise', 'mental', 'general'];
        if (!validCategories.includes(task.category)) {
          console.error(`[Wellness Plan Update] VALIDATION ERROR - Invalid category "${task.category}" in task "${task.title}". Must be one of: ${validCategories.join(', ')}`);
          throw new Error(`Invalid task category: ${task.category}. Must be one of: ${validCategories.join(', ')}`);
        }
      }

      const wellnessPlanData = {
        dietaryPlan: output.dietaryPlan,
        exercisePlan: output.exercisePlan,
        mentalWellnessPlan: output.mentalWellnessPlan,
        dietaryPlanAudioUri: undefined,
        exercisePlanAudioUri: undefined,
        mentalWellnessPlanAudioUri: undefined,
        dailyReminders: output.dailyReminders,
        weeklyMealPlan: output.weeklyMealPlan,
        weeklyTasks: output.weeklyTasks,
        // NEW: Add health insights fields
        coachComment: healthInsights.coachComment,
        healthGoals: healthInsights.healthGoals,
        preventiveAlerts: healthInsights.preventiveAlerts,
        lastUpdated: new Date().toISOString(),
      };

      await updatePatientWellnessPlan(patientId, wellnessPlanData);
      console.log(`[Wellness Plan Update] ✅ Successfully updated wellness plan for patient ${patientId}`);
      console.log(`[Wellness Plan Update] Plan includes ${output.dailyReminders.length} daily reminders, ${output.weeklyMealPlan.length} meal suggestions, and ${output.weeklyTasks.length} weekly tasks`);
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
    // Re-throw the error so the caller can handle it appropriately
    // The caller (exam analysis) should catch this and not block the exam save
    throw error;
  }
}