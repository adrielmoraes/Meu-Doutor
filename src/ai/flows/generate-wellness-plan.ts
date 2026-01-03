
'use server';
/**
 * @fileOverview An AI flow for generating a personalized wellness plan for a patient.
 *
 * - generateWellnessPlan - A function that creates a wellness plan.
 * - GenerateWellnessPlanInput - The input type for the function.
 * - GenerateWellnessPlanOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { nutritionistAgent } from './nutritionist-agent';
import { trackWellnessPlan } from '@/lib/usage-tracker';
import { countTextTokens } from '@/lib/token-counter';

const GenerateWellnessPlanInputSchema = z.object({
    patientId: z.string().optional().describe("The patient ID for usage tracking."),
    patientHistory: z.string().describe("A summary of the patient's medical history and current conditions."),
    examResults: z.string().describe('A summary of the latest exam results.'),
});
export type GenerateWellnessPlanInput = z.infer<typeof GenerateWellnessPlanInputSchema>;

const ReminderSchema = z.object({
    icon: z.enum([
        'Droplet', 'Clock', 'Coffee', 'Bed', 'Dumbbell',
        'Apple', 'Heart', 'Sun', 'Moon', 'Activity',
        'Utensils', 'Brain', 'Smile', 'Wind', 'Leaf'
    ]).describe("The most appropriate icon for the reminder."),
    title: z.string().describe("The short, encouraging title for the reminder."),
    description: z.string().describe("The brief, actionable description of the reminder.")
});

const GoalSchema = z.object({
    shortTerm: z.array(z.string()).describe("2-3 measurable goals for the next 1-2 weeks (e.g., 'Caminhar 15 minutos por dia, 5 vezes na semana')."),
    mediumTerm: z.array(z.string()).describe("2-3 measurable goals for the next 1-3 months (e.g., 'Reduzir 3-5kg de forma saudável')."),
    longTerm: z.array(z.string()).describe("2-3 measurable goals for 6+ months (e.g., 'Manter peso ideal e rotina de exercícios constante').")
});

const MealPrepSuggestionSchema = z.object({
    day: z.string().describe("Day of the week in Portuguese (e.g., Segunda-feira)."),
    breakfast: z.string().describe("Detailed breakfast suggestion with portions."),
    lunch: z.string().describe("Detailed lunch suggestion with portions."),
    dinner: z.string().describe("Detailed dinner suggestion with portions."),
    snacks: z.string().optional().describe("Optional healthy snack suggestions.")
});

const GenerateWellnessPlanOutputSchema = z.object({
    preliminaryAnalysis: z.string().describe("Explicação detalhada dos achados dos exames em linguagem simples e acessível para o paciente entender. Evite termos técnicos."),
    exercisePlan: z.string().describe("A comprehensive yet safe exercise plan with specific activities, duration, frequency, and progression guidelines. Include warm-up and cool-down tips. Adapted to patient's condition."),
    mentalWellnessPlan: z.string().describe("Detailed recommendations for mental well-being including stress management techniques, mindfulness practices, relaxation exercises, and emotional health strategies."),
    weeklyMealPlan: z.array(MealPrepSuggestionSchema).describe("A 7-day meal plan with specific meal suggestions for breakfast, lunch, dinner, and optional snacks. Be specific and practical."),
    hydrationPlan: z.string().describe("Specific hydration recommendations including daily water intake goals, timing suggestions, and tips to remember to drink water throughout the day."),
    sleepPlan: z.string().describe("Comprehensive sleep and rest plan including ideal sleep duration, bedtime routine suggestions, sleep hygiene tips, and relaxation techniques for better sleep quality."),
    goals: GoalSchema.describe("Measurable short-term, medium-term, and long-term wellness goals personalized to the patient's condition and needs."),
    dailyReminders: z.array(ReminderSchema).describe("A list of 5-6 varied, personalized daily reminders covering different aspects of the wellness plan (hydration, meals, exercise, sleep, mindfulness)."),
});
export type GenerateWellnessPlanOutput = z.infer<typeof GenerateWellnessPlanOutputSchema>;


const wellnessPlanPrompt = ai.definePrompt({
    name: 'generateWellnessPlanPrompt',
    input: {
        schema: z.object({
            patientHistory: z.string(),
            examResults: z.string(),
            nutritionistReport: z.string(),
            nutritionistRecommendations: z.string(),
        })
    },
    output: { schema: GenerateWellnessPlanOutputSchema },
    prompt: `Você é um assistente de saúde holística altamente qualificado, especializado em criar planos de bem-estar personalizados, detalhados e motivacionais.

**SUA MISSÃO:** Criar um plano de bem-estar COMPLETO e PERSONALIZADO que seja prático, encorajador e fácil de seguir para o paciente.

**CONTEXTO DO PACIENTE:**

📋 **Histórico Médico:**
{{{patientHistory}}}

🔬 **Resultados de Exames:**
{{{examResults}}}

🥗 **Avaliação Nutricional (do Nutricionista IA):**
{{{nutritionistReport}}}

💡 **Recomendações Nutricionais Específicas:**
{{{nutritionistRecommendations}}}

---

**INSTRUÇÕES DETALHADAS PARA CADA SEÇÃO:**

**1. ANÁLISE PRELIMINAR (preliminaryAnalysis):**
- Explique os achados dos exames de forma clara e acessível
- Use linguagem POPULAR, evite termos técnicos médicos
- Quando usar termos técnicos, explique-os imediatamente
- Resuma os principais achados e o que significam para a saúde
- Destaque pontos de atenção de forma tranquilizadora (sem alarmar)
- Compare valores com referências normais quando relevante
- Seja empático, educativo e encorajador

**Exemplo de estrutura:**
"📊 **O que seus exames mostram:**
✅ **Pontos positivos:** [o que está bem]
⚠️ **Pontos de atenção:** [o que merece cuidado, explicado de forma simples]
💡 **O que isso significa:** [explicação clara]"

**2. PLANO DE EXERCÍCIOS (exercisePlan):**
- Sugira atividades ESPECÍFICAS adequadas à condição do paciente
- Inclua frequência semanal, duração de cada sessão, e intensidade
- Ofereça progressão gradual (como aumentar ao longo das semanas)
- Mencione aquecimento e desaquecimento
- Seja realista e encorajador - comece devagar se necessário
- Adapte ao nível de condicionamento e limitações do paciente

**Exemplo:**
"🏃 **Atividades Recomendadas:**
- Caminhada leve: 20-30 minutos, 4-5x/semana
- Alongamento: 10 minutos diários
- [outras atividades específicas]

📈 **Progressão:** [como evoluir gradualmente]
⚠️ **Importante:** [precauções e adaptações]"

**3. PLANO DE BEM-ESTAR MENTAL (mentalWellnessPlan):**
- Técnicas ESPECÍFICAS de gestão de estresse (respiração profunda 4-7-8, meditação guiada)
- Práticas de mindfulness e atenção plena
- Sugestões para saúde emocional e equilíbrio
- Atividades relaxantes personalizadas
- Importância do autocuidado e tempo pessoal

**4. PLANO SEMANAL DE REFEIÇÕES (weeklyMealPlan):**
- Crie um plano para 7 dias (Segunda a Domingo)
- Para cada dia, forneça sugestões ESPECÍFICAS e PRÁTICAS de:
  * Café da manhã com porções
  * Almoço com porções
  * Jantar com porções
  * Lanches saudáveis (opcional)
- Seja criativo mas prático - use alimentos acessíveis
- Varie as opções ao longo da semana
- Baseie-se nas recomendações nutricionais fornecidas

**Exemplo de estrutura para um dia:**
- day: "Segunda-feira"
- breakfast: "1 taça de iogurte natural com 2 colheres de aveia e frutas vermelhas + 1 fatia de pão integral com pasta de amendoim"
- lunch: "Peito de frango grelhado (120g) + arroz integral (4 colheres) + feijão (2 colheres) + salada verde variada com azeite"
- dinner: "Salmão assado (100g) + batata doce (1 média) + brócolis no vapor"
- snacks: "1 maçã + 10 amêndoas ou 1 iogurte grego"

**5. PLANO DE HIDRATAÇÃO (hydrationPlan):**
- Meta ESPECÍFICA de água diária (ex: 2-2.5 litros)
- Distribua ao longo do dia (ex: 1 copo ao acordar, 1 antes de cada refeição)
- Dicas práticas para lembrar de beber água
- Inclua outras fontes saudáveis de hidratação se apropriado (chás, água de coco)
- Explique os benefícios da boa hidratação

**6. PLANO DE SONO E DESCANSO (sleepPlan):**
- Duração ideal de sono (geralmente 7-9 horas)
- Rotina de preparação para dormir (horário consistente, ritual relaxante)
- Higiene do sono (ambiente, temperatura, luz, eletrônicos)
- Técnicas de relaxamento para facilitar o sono
- Importância do descanso adequado para a saúde

**7. OBJETIVOS MENSURÁVEIS (goals):**
Crie objetivos SMART (Específicos, Mensuráveis, Atingíveis, Relevantes, Temporais):

- **Curto Prazo (1-2 semanas):** 2-3 objetivos pequenos e alcançáveis
  * Exemplo: "Caminhar 15 minutos por dia, 5 vezes na semana"
  * Exemplo: "Beber pelo menos 2 litros de água diariamente"

- **Médio Prazo (1-3 meses):** 2-3 objetivos mais ambiciosos
  * Exemplo: "Reduzir 3-5kg de forma saudável"
  * Exemplo: "Estabelecer rotina de exercícios 4x/semana"

- **Longo Prazo (6+ meses):** 2-3 objetivos de transformação
  * Exemplo: "Manter peso ideal e estilo de vida saudável"
  * Exemplo: "Melhorar exames de colesterol e glicemia"

**8. LEMBRETES DIÁRIOS (dailyReminders):**
Crie 5-6 lembretes variados e personalizados que cobrem:
- Hidratação
- Alimentação saudável
- Atividade física
- Bem-estar mental
- Sono/descanso
- Autocuidado

Escolha ícones apropriados e use linguagem MOTIVACIONAL e POSITIVA.

**Exemplos de lembretes:**
- icon: "Droplet" | title: "💧 Hora de Hidratar!" | description: "Beba um copo de água agora. Seu corpo agradece!"
- icon: "Apple" | title: "🍎 Lanche Saudável" | description: "Que tal uma fruta ou um punhado de castanhas?"
- icon: "Activity" | title: "🏃 Movimento é Vida!" | description: "15 minutos de caminhada hoje. Você consegue!"
- icon: "Moon" | title: "🌙 Hora de Relaxar" | description: "Prepare-se para uma noite de sono reparador."
- icon: "Heart" | title: "❤️ Cuide de Você" | description: "Reserve 5 minutos para respirar fundo e relaxar."

---

**TOM E ESTILO:**
✅ Sempre ENCORAJADOR e MOTIVACIONAL
✅ Use emojis moderadamente para tornar mais amigável
✅ Seja ESPECÍFICO e PRÁTICO - evite generalidades
✅ Explique os BENEFÍCIOS das recomendações
✅ Linguagem acessível e empática
✅ TODO o conteúdo em PORTUGUÊS BRASILEIRO
✅ Personalize com base nos dados do paciente

**EXEMPLO DE TOM:**
❌ "Coma mais frutas e legumes."
✅ "Inclua pelo menos 3 porções de frutas variadas por dia (ex: 1 banana no café, 1 maçã no lanche, morangos na sobremesa). Elas vão te dar energia, melhorar sua imunidade e te ajudar a alcançar seus objetivos de saúde! 🍎🍌"

Agora, com base em TODAS as informações fornecidas, crie o plano de bem-estar COMPLETO, DETALHADO e PERSONALIZADO para este paciente.`,
});


export async function generateWellnessPlan(
    input: GenerateWellnessPlanInput
): Promise<GenerateWellnessPlanOutput> {
    return generateWellnessPlanFlow(input);
}


const generateWellnessPlanFlow = ai.defineFlow(
    {
        name: 'generateWellnessPlanFlow',
        inputSchema: GenerateWellnessPlanInputSchema,
        outputSchema: GenerateWellnessPlanOutputSchema,
    },
    async (input) => {
        // 1. Consult the nutritionist to get expert dietary advice with enhanced context
        const nutritionistReport = await nutritionistAgent({
            patientHistory: input.patientHistory,
            examResults: input.examResults,
        });

        // Track nutritionist agent LLM usage if patientId is provided
        if (input.patientId) {
            const nutritionistInputText = [input.patientHistory, input.examResults].filter(Boolean).join('\n\n');
            const nutritionistOutputText = [
                nutritionistReport.findings || '',
                (nutritionistReport as any).clinicalAssessment || '',
                nutritionistReport.recommendations || ''
            ].filter(Boolean).join('\n\n');
            const nutritionistInputTokens = countTextTokens(nutritionistInputText);
            const nutritionistOutputTokens = countTextTokens(nutritionistOutputText);
            trackWellnessPlan(input.patientId, nutritionistInputTokens, nutritionistOutputTokens, 'gemini-3-flash-preview')
                .catch(err => console.error('[Generate Wellness Plan] Nutritionist tracking error:', err));
        }

        let attempt = 0;
        const maxAttempts = 3;
        let lastError: any;

        while (attempt < maxAttempts) {
            try {
                const { output } = await wellnessPlanPrompt({
                    patientHistory: input.patientHistory,
                    examResults: input.examResults,
                    nutritionistReport: nutritionistReport.findings,
                    nutritionistRecommendations: nutritionistReport.recommendations,
                });

                // Track wellness plan synthesis LLM usage if patientId is provided
                if (input.patientId && output) {
                    const synthesisInputText = [
                        input.patientHistory,
                        input.examResults,
                        nutritionistReport.findings || '',
                        nutritionistReport.recommendations || ''
                    ].filter(Boolean).join('\n\n');
                    const synthesisInputTokens = countTextTokens(synthesisInputText);
                    const synthesisOutputTokens = countTextTokens(JSON.stringify(output || {}));
                    trackWellnessPlan(input.patientId, synthesisInputTokens, synthesisOutputTokens, 'gemini-2.5-flash')
                        .catch(err => console.error('[Generate Wellness Plan] Synthesis tracking error:', err));
                }

                return output!;
            } catch (err: any) {
                lastError = err;
                // Only retry on schema validation errors
                if (err?.message?.includes('Schema validation failed')) {
                    attempt += 1;
                    console.warn(`Wellness plan generation failed schema validation (attempt ${attempt}). Retrying...`);
                    continue;
                }
                throw err;
            }
        }

        // If still failing after retries, throw the last encountered error so the caller can handle it
        throw lastError;
    }
);
