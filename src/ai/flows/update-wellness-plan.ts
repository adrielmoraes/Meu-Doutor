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
  weeklyRecipes: z.array(z.object({
    id: z.string().describe("Unique ID for the recipe (use format: recipe-1, recipe-2, etc)"),
    title: z.string().describe("Nome atrativo da receita"),
    mealType: z.enum(['cafe-da-manha', 'almoco', 'jantar', 'lanche']),
    ingredients: z.array(z.string()).describe("Lista de ingredientes com quantidades"),
    instructions: z.string().describe("Modo de preparo passo a passo"),
    dayOfWeek: z.string().describe("Dia da semana sugerido (Segunda-feira, Terça-feira, etc)"),
  })).describe("7 receitas saudáveis, uma para cada dia da semana"),
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

5. **Receitas Semanais (weeklyRecipes):**
   - Create EXACTLY 7 healthy recipes, one for each day of the week
   - Each recipe must be tailored to the patient's medical conditions and exam results
   - Each recipe must have:
     * **id**: Use format "recipe-1", "recipe-2", etc (sequential numbering)
     * **title**: Nome atrativo e apetitoso da receita em português
     * **mealType**: Choose from 'cafe-da-manha', 'almoco', 'jantar', 'lanche'
     * **ingredients**: Array with 5-8 ingredients with quantities (e.g., ["2 xícaras de aveia", "1 banana madura", "200ml de leite desnatado"])
     * **instructions**: Detailed step-by-step preparation in a single string, using line breaks for each step
     * **dayOfWeek**: Must be one of "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"
   - Ensure recipes are:
     * Nutritionally balanced and therapeutic for their conditions
     * Easy to prepare (20-40 minutes maximum)
     * Use accessible, affordable ingredients
     * Include variety (different proteins, grains, vegetables)
     * Follow dietary restrictions from exam results
   - Example:
     * {id: "recipe-1", title: "Mingau de Aveia com Frutas", mealType: "cafe-da-manha", ingredients: ["1 xícara de aveia em flocos", "2 xícaras de leite desnatado", "1 banana", "1 colher de mel", "Canela a gosto"], instructions: "1. Aqueça o leite em fogo médio\n2. Adicione a aveia e mexa constantemente\n3. Cozinhe por 5-7 minutos até engrossar\n4. Desligue o fogo e adicione mel e canela\n5. Sirva com rodelas de banana por cima", dayOfWeek: "Segunda-feira"}

6. **Tarefas Semanais (weeklyTasks):**
   - Create 7-10 specific, achievable tasks for the week
   - Distribute tasks across categories: 'nutrition', 'exercise', 'mental', 'general'
   - Each task must have:
     * **id**: Use format "task-1", "task-2", etc (sequential numbering)
     * **category**: Choose from 'nutrition', 'exercise', 'mental', 'general'
     * **title**: Clear, action-oriented title (e.g., "Caminhar 30 minutos", "Preparar refeições saudáveis")
     * **description**: Brief explanation of the task
     * **dayOfWeek**: (Optional) Suggest a day like "Segunda", "Quarta", "Sexta" or leave empty
     * **completed**: Always set to false (patient will mark as done)
     * **completedAt**: Leave empty
   - Make tasks specific, measurable, and achievable
   - Balance tasks across the week
   - Examples:
     * {id: "task-1", category: "nutrition", title: "Planejar cardápio da semana", description: "Reserve 20 minutos para planejar refeições balanceadas", dayOfWeek: "Domingo", completed: false}
     * {id: "task-2", category: "exercise", title: "Caminhar 30 minutos", description: "Caminhada leve ao ar livre ou esteira", dayOfWeek: "Segunda", completed: false}
     * {id: "task-3", category: "mental", title: "Meditação guiada", description: "10 minutos de meditação ou respiração profunda", dayOfWeek: "Quarta", completed: false}

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
      // Validate reminders before saving
      for (const reminder of output.dailyReminders) {
        const validIcons = ['Droplet', 'Clock', 'Coffee', 'Bed', 'Dumbbell'];
        if (!validIcons.includes(reminder.icon)) {
          console.error(`[Wellness Plan Update] VALIDATION ERROR - Invalid icon "${reminder.icon}" in reminder "${reminder.title}". Must be one of: ${validIcons.join(', ')}`);
          console.error(`[Wellness Plan Update] Full reminder data:`, JSON.stringify(reminder, null, 2));
          throw new Error(`Invalid reminder icon: ${reminder.icon}. Must be one of: ${validIcons.join(', ')}`);
        }
      }

      // Validate weekly recipes before saving
      for (const recipe of output.weeklyRecipes) {
        const validMealTypes = ['cafe-da-manha', 'almoco', 'jantar', 'lanche'];
        if (!validMealTypes.includes(recipe.mealType)) {
          console.error(`[Wellness Plan Update] VALIDATION ERROR - Invalid mealType "${recipe.mealType}" in recipe "${recipe.title}". Must be one of: ${validMealTypes.join(', ')}`);
          throw new Error(`Invalid recipe mealType: ${recipe.mealType}. Must be one of: ${validMealTypes.join(', ')}`);
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

      // Convert recipes to tasks automatically
      const recipeTasks = output.weeklyRecipes.map((recipe, index) => ({
        id: `recipe-task-${index + 1}`,
        category: 'nutrition' as const,
        title: `Preparar: ${recipe.title}`,
        description: `Receita de ${recipe.mealType.replace('-', ' ')} para ${recipe.dayOfWeek}`,
        dayOfWeek: recipe.dayOfWeek,
        completed: false,
        completedAt: undefined,
      }));

      // Combine AI-generated tasks with recipe tasks
      const allTasks = [...output.weeklyTasks, ...recipeTasks];

      const wellnessPlanData = {
        dietaryPlan: output.dietaryPlan,
        exercisePlan: output.exercisePlan,
        mentalWellnessPlan: output.mentalWellnessPlan,
        dailyReminders: output.dailyReminders,
        weeklyRecipes: output.weeklyRecipes,
        weeklyTasks: allTasks,
        lastUpdated: new Date().toISOString(),
      };

      await updatePatientWellnessPlan(patientId, wellnessPlanData);
      console.log(`[Wellness Plan Update] ✅ Successfully updated wellness plan for patient ${patientId}`);
      console.log(`[Wellness Plan Update] Plan includes ${output.dailyReminders.length} daily reminders, ${output.weeklyRecipes.length} recipes, and ${allTasks.length} weekly tasks`);
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
