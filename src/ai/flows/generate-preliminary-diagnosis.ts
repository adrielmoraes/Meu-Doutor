'use server';
/**
 * @fileOverview AI flow for orchestrating a team of specialist agents to generate a preliminary diagnosis.
 *
 * - generatePreliminaryDiagnosis - Function that acts as a General Practitioner AI, coordinating specialists.
 * - GeneratePreliminaryDiagnosisInput - Input type for the function.
 * - GeneratePreliminaryDiagnosisOutput - Output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  SpecialistAgentInputSchema,
  SpecialistAgentOutputSchema,
  type SpecialistAgentInput,
} from './specialist-agent-types';
import {cardiologistAgent} from './cardiologist-agent';
import {pulmonologistAgent} from './pulmonologist-agent';
import {radiologistAgent} from './radiologist-agent';
import {neurologistAgent} from './neurologist-agent';
import {gastroenterologistAgent} from './gastroenterologist-agent';
import {endocrinologistAgent} from './endocrinologist-agent';
import {dermatologistAgent} from './dermatologist-agent';
import {orthopedistAgent} from './orthopedist-agent';
import {ophthalmologistAgent} from './ophthalmologist-agent';
import {otolaryngologistAgent} from './otolaryngologist-agent';
import {nutritionistAgent} from './nutritionist-agent';
import {pediatricianAgent} from './pediatrician-agent';
import { gynecologistAgent } from './gynecologist-agent';
import { urologistAgent } from './urologist-agent';
import { psychiatristAgent } from './psychiatrist-agent';

// Define Schemas centrally
const GeneratePreliminaryDiagnosisInputSchema = SpecialistAgentInputSchema;
export type GeneratePreliminaryDiagnosisInput = z.infer<
  typeof GeneratePreliminaryDiagnosisInputSchema
>;

const SpecialistFindingSchema = z.object({
  specialist: z.string().describe("The name of the specialist providing the finding, e.g., 'Dra. Ana (Cardiologista)' or 'Dr. Miguel (Radiologista)'."),
  findings: z.string().describe("The detailed clinical findings from the specialist."),
  clinicalAssessment: z.string().describe("The specialist's assessment of severity and urgency."),
  recommendations: z.string().describe("Specific recommendations from this specialist."),
});

const GeneratePreliminaryDiagnosisOutputSchema = z.object({
  synthesis: z
    .string()
    .describe(
      'A comprehensive preliminary diagnosis synthesized by the orchestrator AI from all specialist findings.'
    ),
  suggestions: z
    .string()
    .describe(
      'A list of suggested next steps, further tests, or specialist referrals for the human doctor to consider.'
    ),
  structuredFindings: z.array(SpecialistFindingSchema).describe("The structured list of findings from each consulted specialist.")
});
export type GeneratePreliminaryDiagnosisOutput = z.infer<
  typeof GeneratePreliminaryDiagnosisOutputSchema
>;

const specialistAgents = {
  'Dra. Ana (Cardiologista)': cardiologistAgent,
  'Dr. Carlos (Pneumologista)': pulmonologistAgent,
  'Dr. Miguel (Radiologista)': radiologistAgent,
  'Dr. Daniel (Neurologista)': neurologistAgent,
  'Dr. Roberto (Gastroenterologista)': gastroenterologistAgent,
  'Dra. Beatriz (Endocrinologista)': endocrinologistAgent,
  'Dr. Lucas (Dermatologista)': dermatologistAgent,
  'Dra. Nilma (Ortopedista)': orthopedistAgent,
  'Dra. Sofia (Oftalmologista)': ophthalmologistAgent,
  'Dr. Rafael (Otorrinolaringologista)': otolaryngologistAgent,
  'Dra. Laura (Nutricionista)': nutritionistAgent,
  'Dra. Nathalia (Pediatra)': pediatricianAgent,
  'Dra. Helena (Ginecologista)': gynecologistAgent,
  'Dr. André (Urologista)': urologistAgent,
  'Dra. Sofia (Psiquiatra)': psychiatristAgent,
};
type Specialist = keyof typeof specialistAgents;

const triagePrompt = ai.definePrompt({
  name: 'specialistTriagePrompt',
  input: {schema: GeneratePreliminaryDiagnosisInputSchema},
  output: {
    schema: z.object({
      specialists: z
        .array(z.enum(Object.keys(specialistAgents) as [Specialist, ...Specialist[]]))
        .describe(
          'A list of specialist agents to consult for this case, based on the patient data. Choose the most relevant specialists.'
        ),
    }),
  },
  prompt: `You are Dr. Márcio Silva, a highly experienced General Practitioner AI and Medical Coordinator with 20+ years of clinical practice. Your role is to analyze patient data and determine which specialist consultations are ABSOLUTELY NECESSARY for an accurate diagnosis.

**CRITICAL INSTRUCTIONS:**
1. **Be Selective**: Only select specialists whose expertise is DIRECTLY relevant to the symptoms, exam results, or medical history provided. Quality over quantity.
2. **Evidence-Based Selection**: Each specialist you choose must have clear evidence in the patient data justifying their consultation.
3. **Avoid Over-Referral**: Do NOT select specialists "just in case" or for preventive screening unless explicitly indicated by the data.
4. **Prioritize Urgency**: If multiple specialists are needed, prioritize those addressing the most urgent or severe findings.

**Available Specialists:**
${Object.keys(specialistAgents).join(', ')}

**Patient Data to Analyze:**

**Exam Results:**
{{examResults}}

**Patient History & Symptoms:**
{{patientHistory}}

**Your Task:**
Based SOLELY on the information above, select only the specialists whose expertise is essential for diagnosing this patient's current condition. If the data shows no clear need for specialist consultation, return an empty array.

Think step-by-step:
1. What are the key symptoms and findings?
2. Which body systems or organ groups are affected?
3. Which specialists have direct expertise in those areas?
4. Are there any urgent or critical findings requiring immediate specialist attention?`,
});

const synthesisPrompt = ai.definePrompt({
  name: 'diagnosisSynthesisPrompt',
  input: {
    schema: z.object({
      patientHistory: z.string(),
      examResults: z.string(),
      specialistReports: z.array(
        z.object({
          specialist: z.string(),
          findings: z.string(),
        })
      ),
    }),
  },
  output: {schema: z.object({ synthesis: z.string(), suggestions: z.string() })},
  prompt: `You are Dr. Márcio Silva, an experienced General Practitioner AI and Medical Coordinator synthesizing specialist consultations into a comprehensive clinical assessment.

**Your Mission:**
Create a unified, actionable preliminary diagnosis by integrating all specialist findings into a coherent clinical picture that a human physician can immediately act upon.

**SYNTHESIS PRINCIPLES:**
1. **Clinical Integration**: Identify connections and interactions between different specialist findings
2. **Severity Prioritization**: Highlight the most critical or urgent findings first
3. **Evidence-Based**: Base every statement on the specialist reports provided - no speculation
4. **Actionable Output**: Your synthesis should guide immediate clinical decision-making

**Patient Context:**

**History:**
{{{patientHistory}}}

**Exam Results:**
{{{examResults}}}

**Specialist Consultations:**
{{#each specialistReports}}
---
**{{specialist}}**

**Achados Clínicos:** {{{findings}}}

**Avaliação de Gravidade:** {{{clinicalAssessment}}}

**Recomendações:** {{{recommendations}}}
---
{{/each}}

**Your Tasks:**

**1. SYNTHESIS (Diagnóstico Preliminar Integrado):**
- Integrate all specialist findings into a unified clinical picture
- Identify the primary diagnosis and any secondary conditions
- Note any concerning interactions or compounding factors
- Highlight urgent or critical findings requiring immediate attention
- Use clear, professional Brazilian Portuguese medical terminology

**2. SUGGESTIONS (Próximos Passos Recomendados):**
- Prioritize by urgency (immediate actions first, then follow-up)
- List specific tests or imaging needed (with clinical justification)
- Recommend specialist referrals if additional consultation is needed
- Suggest treatment considerations for the attending physician to evaluate
- Include timeline recommendations (urgent, short-term, routine follow-up)

Remember: Your synthesis will be reviewed by a human physician who will make the final diagnostic and treatment decisions.`,
});


const generatePreliminaryDiagnosisFlow = ai.defineFlow(
  {
    name: 'generatePreliminaryDiagnosisFlow',
    inputSchema: GeneratePreliminaryDiagnosisInputSchema,
    outputSchema: GeneratePreliminaryDiagnosisOutputSchema,
  },
  async input => {
    // Step 1: Triage to decide which specialists to call.
    const triageResult = await triagePrompt(input);
    const specialistsToCall = triageResult.output?.specialists || [];

    if (specialistsToCall.length === 0) {
      return {
        synthesis: 'Não foi possível determinar uma especialidade relevante para este caso.',
        suggestions: 'Recomenda-se uma avaliação clínica geral para determinar os próximos passos.',
        structuredFindings: [],
      };
    }

    // Step 2: Call the selected specialist agents in parallel.
    const specialistPromises = specialistsToCall.map(specialistKey => {
      const agent = specialistAgents[specialistKey];
      return agent(input).then(report => ({
        specialist: specialistKey,
        findings: report.findings,
        clinicalAssessment: report.clinicalAssessment,
        recommendations: report.recommendations,
      }));
    });

    const specialistReports = await Promise.all(specialistPromises);
    
    // Step 3: Synthesize the reports into a final diagnosis.
    const synthesisResult = await synthesisPrompt({
      ...input,
      specialistReports,
    });

    return {
        synthesis: synthesisResult.output!.synthesis,
        suggestions: synthesisResult.output!.suggestions,
        structuredFindings: specialistReports,
    };
  }
);


export async function generatePreliminaryDiagnosis(
  input: SpecialistAgentInput
): Promise<GeneratePreliminaryDiagnosisOutput> {
  return generatePreliminaryDiagnosisFlow(input);
}
