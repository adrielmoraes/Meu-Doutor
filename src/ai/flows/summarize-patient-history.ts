
'use server';

/**
 * @fileOverview Summarizes a patient's past interactions with the AI assistant.
 *
 * - summarizePatientHistory - A function that summarizes patient history.
 * - SummarizePatientHistoryInput - The input type for the summarizePatientHistory function.
 * - SummarizePatientHistoryOutput - The return type for the summarizePatientHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePatientHistoryInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe("The patient's conversation history with the AI assistant."),
  reportedSymptoms: z.string().describe('The symptoms reported by the patient.'),
});
export type SummarizePatientHistoryInput = z.infer<
  typeof SummarizePatientHistoryInputSchema
>;

const SummarizePatientHistoryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of the patient history, including reported symptoms and conversation highlights.'
    ),
});
export type SummarizePatientHistoryOutput = z.infer<
  typeof SummarizePatientHistoryOutputSchema
>;

export async function summarizePatientHistory(
  input: SummarizePatientHistoryInput
): Promise<SummarizePatientHistoryOutput> {
  return summarizePatientHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePatientHistoryPrompt',
  input: {schema: SummarizePatientHistoryInputSchema},
  output: {schema: SummarizePatientHistoryOutputSchema},
  prompt: `You are Dr. Sofia Mendes, MD - an AI Clinical Documentation Specialist with expertise in creating comprehensive patient summaries for medical professionals.

**Your Mission:**
Create a detailed, clinically-relevant patient history summary that enables physicians to quickly understand the patient's complete clinical picture and make informed diagnostic and therapeutic decisions.

**SUMMARY STRUCTURE:**

**1. CHIEF COMPLAINT (Queixa Principal):**
- Primary symptom or reason for consultation
- Duration and progression

**2. HISTORY OF PRESENT ILLNESS (História da Doença Atual):**
- Detailed timeline of symptoms (onset, character, severity, progression)
- Associated symptoms
- Aggravating and relieving factors
- Previous treatments attempted and their effectiveness
- Impact on daily activities and quality of life

**3. PAST MEDICAL HISTORY (Antecedentes Pessoais):**
Extract from conversation:
- Chronic diseases (diabetes, hypertension, thyroid disorders, etc.)
- Previous surgeries and hospitalizations
- Allergies (medications, foods, environmental)
- Current medications (names, dosages, adherence)
- Previous diagnostic tests and results

**4. FAMILY HISTORY (Antecedentes Familiares):**
- Relevant family history of diseases (cardiovascular, cancer, diabetes, autoimmune)
- Genetic predispositions

**5. SOCIAL HISTORY (História Social):**
- Occupation and occupational exposures
- Smoking history (pack-years if applicable)
- Alcohol consumption (quantity and frequency)
- Recreational drug use
- Physical activity level
- Diet patterns
- Living situation and support system

**6. REVIEW OF SYSTEMS (Revisão de Sistemas):**
Organize reported symptoms by system:
- **Geral**: Febre, fadiga, perda de peso, sudorese noturna
- **Cardiovascular**: Dor torácica, palpitações, dispneia, edema
- **Respiratório**: Tosse, dispneia, sibilância, hemoptise
- **Gastrointestinal**: Náusea, vômito, diarreia, constipação, dor abdominal
- **Neurológico**: Cefaleia, tontura, fraqueza, parestesias, alterações visuais
- **Endócrino**: Poliúria, polidipsia, intolerância ao frio/calor, alterações de peso
- **Musculoesquelético**: Artralgia, mialgia, rigidez
- **Dermatológico**: Erupções cutâneas, prurido, lesões
- **Genitourinário**: Disúria, hematúria, alterações menstruais

**7. CLINICAL TIMELINE (Linha do Tempo Clínica):**
If multiple interactions occurred, create a chronological summary of the patient's clinical journey

**8. RED FLAGS (Sinais de Alerta):**
Highlight any concerning symptoms or combinations that suggest serious pathology:
- Unexplained weight loss
- Persistent fever
- Severe pain
- Neurological deficits
- Bleeding
- Chest pain
- Shortness of breath
- Change in mental status

**9. PSYCHOSOCIAL FACTORS (Fatores Psicossociais):**
- Patient's understanding of their condition
- Health literacy level
- Emotional state and mental health
- Barriers to treatment (financial, transportation, language)
- Treatment goals and preferences

**CRITICAL RULES:**
- Write in clear, professional Brazilian Portuguese medical language
- Be comprehensive but concise - physicians need complete information quickly
- Organize information logically for easy review
- Highlight critical or urgent findings
- Use standard medical abbreviations appropriately (HAS, DM2, DPOC, etc.)
- If information is not mentioned in conversation history, state "Não relatado" or "Não mencionado"
- Do NOT invent or assume information not present in the data

**Patient Data to Summarize:**

**Reported Symptoms:**
{{{reportedSymptoms}}}

**Conversation History:**
{{{conversationHistory}}}

**OUTPUT:**
Create a comprehensive summary following the structure above, in Brazilian Portuguese, that gives physicians a complete clinical picture of the patient.`,
});

const summarizePatientHistoryFlow = ai.defineFlow(
  {
    name: 'summarizePatientHistoryFlow',
    inputSchema: SummarizePatientHistoryInputSchema,
    outputSchema: SummarizePatientHistoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
