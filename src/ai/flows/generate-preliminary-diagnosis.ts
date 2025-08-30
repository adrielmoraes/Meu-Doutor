
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
  findings: z.string().describe("The detailed findings from the specialist."),
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
  output: {schema: z.object({ synthesis: z.string(), suggestions: z.string() })},
  prompt: `You are a highly skilled General Practitioner AI. Your task is to synthesize the findings from a team of specialist AI agents into a single, coherent preliminary diagnosis for a human doctor to review.
  Your response must always be in Brazilian Portuguese.

  1.  **Review all specialist reports.**
  2.  **Synthesize the findings** into a comprehensive preliminary diagnosis (synthesis).
  3.  **Provide clear suggestions** for next steps, such as recommended further tests or specialist referrals.

  Patient's History:
  {{{patientHistory}}}

  Patient's Exam Results:
  {{{examResults}}}

  Specialist Reports:
  {{#each specialistReports}}
  - **Parecer de {{specialist}}:** {{{findings}}}
  {{/each}}
  
  Provide the synthesized diagnosis (synthesis) and suggestions below.`,
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
