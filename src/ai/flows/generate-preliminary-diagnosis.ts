
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

const specialistAgents = {
  cardiologist: cardiologistAgent,
  pulmonologist: pulmonologistAgent,
  radiologist: radiologistAgent,
  neurologist: neurologistAgent,
  gastroenterologist: gastroenterologistAgent,
  endocrinologist: endocrinologistAgent,
  dermatologist: dermatologistAgent,
  orthopedist: orthopedistAgent,
  ophthalmologist: ophthalmologistAgent,
  otolaryngologist: otolaryngologistAgent,
  nutritionist: nutritionistAgent,
  pediatrician: pediatricianAgent,
};
type Specialist = keyof typeof specialistAgents;

const GeneratePreliminaryDiagnosisInputSchema = z.object({
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string.'),
});
export type GeneratePreliminaryDiagnosisInput = z.infer<
  typeof GeneratePreliminaryDiagnosisInputSchema
>;

const GeneratePreliminaryDiagnosisOutputSchema = z.object({
  diagnosis: z
    .string()
    .describe(
      'The comprehensive preliminary diagnosis synthesized by the orchestrator AI from all specialist findings.'
    ),
  suggestions: z
    .string()
    .describe(
      'A list of suggested next steps, further tests, or specialist referrals for the human doctor to consider.'
    ),
});
export type GeneratePreliminaryDiagnosisOutput = z.infer<
  typeof GeneratePreliminaryDiagnosisOutputSchema
>;

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
  prompt: `You are a General Practitioner AI responsible for triaging patient cases to the correct specialist AI agents.
  Your response must always be in Brazilian Portuguese.
  
  Based on the patient's history and exam results, identify which of the following specialists are most relevant to consult for a comprehensive diagnosis.

  Available specialists: ${Object.keys(specialistAgents).join(', ')}.

  Patient's exam results:
  {{examResults}}

  Patient's history and symptoms summary:
  {{patientHistory}}
  
  Select the specialists that are most appropriate for this case.`,
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
  output: {schema: GeneratePreliminaryDiagnosisOutputSchema},
  prompt: `You are a highly skilled General Practitioner AI. Your task is to synthesize the findings from a team of specialist AI agents into a single, coherent preliminary diagnosis for a human doctor to review.
  Your response must always be in Brazilian Portuguese.

  1.  **Review all specialist reports.**
  2.  **Synthesize the findings** into a comprehensive preliminary diagnosis.
  3.  **Provide clear suggestions** for next steps, such as recommended further tests or specialist referrals.

  Patient's History:
  {{{patientHistory}}}

  Patient's Exam Results:
  {{{examResults}}}

  Specialist Reports:
  {{#each specialistReports}}
  - **Dr. {{specialist}}'s Report:** {{{findings}}}
  {{/each}}
  
  Provide the synthesized diagnosis and suggestions below.`,
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
        diagnosis: 'Não foi possível determinar uma especialidade relevante para este caso.',
        suggestions: 'Recomenda-se uma avaliação clínica geral para determinar os próximos passos.',
      };
    }

    // Step 2: Call the selected specialist agents in parallel.
    const specialistPromises = specialistsToCall.map(specialistKey => {
      const agent = specialistAgents[specialistKey];
      return agent(input).then(report => ({
        specialist: specialistKey,
        findings: report.findings,
      }));
    });

    const specialistReports = await Promise.all(specialistPromises);
    
    // Step 3: Synthesize the reports into a final diagnosis.
    const synthesisResult = await synthesisPrompt({
      ...input,
      specialistReports,
    });

    return synthesisResult.output!;
  }
);


export async function generatePreliminaryDiagnosis(
  input: GeneratePreliminaryDiagnosisInput
): Promise<GeneratePreliminaryDiagnosisOutput> {
  return generatePreliminaryDiagnosisFlow(input);
}
