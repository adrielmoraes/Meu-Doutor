
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
      'Actionable suggestions for next steps and further tests, based on the combined specialist input.'
    ),
});
export type GeneratePreliminaryDiagnosisOutput = z.infer<
  typeof GeneratePreliminaryDiagnosisOutputSchema
>;

export async function generatePreliminaryDiagnosis(
  input: GeneratePreliminaryDiagnosisInput
): Promise<GeneratePreliminaryDiagnosisOutput> {
  return generatePreliminaryDiagnosisFlow(input);
}

const synthesisPrompt = ai.definePrompt({
  name: 'generatePreliminaryDiagnosisPrompt',
  input: {schema: z.any()},
  output: {schema: GeneratePreliminaryDiagnosisOutputSchema},
  prompt: `You are an expert AI General Practitioner, an orchestrator for a team of AI medical specialists.
Your role is to synthesize the findings from your specialist team into a single, coherent preliminary diagnosis.
Your response must always be in Brazilian Portuguese.

Patient's exam results:
{{examResults}}

Patient's history and symptoms summary:
{{patientHistory}}

You have consulted with your team of specialists, and here are their reports:
{{{specialistReports}}}

Synthesize all these reports into a clear, comprehensive preliminary diagnosis. Provide actionable suggestions for next steps or further tests based on the combined findings. Address the report to the human doctor reviewing the case.`,
});

const triagePrompt = ai.definePrompt({
  name: 'triageSpecialistsPrompt',
  input: {schema: GeneratePreliminaryDiagnosisInputSchema},
  output: {
    schema: z.object({
      specialists: z
        .array(z.string())
        .describe(
          'A list of specialist keys that should be consulted for this case.'
        ),
    }),
  },
  prompt: `You are a triage AI. Your job is to read the patient data and decide which specialists are most relevant to this case.
  Your response must always be in Brazilian Portuguese.
  
  Available specialists: ${Object.keys(specialistAgents).join(', ')}.
  
  Patient's exam results:
  {{examResults}}

  Patient's history and symptoms summary:
  {{patientHistory}}

  Based on the data, return a list of specialist keys that should be consulted. For example, if there are heart and lung issues, return ["cardiologist", "pulmonologist"]. If the patient is a child, always include "pediatrician".`,
});

const generatePreliminaryDiagnosisFlow = ai.defineFlow(
  {
    name: 'generatePreliminaryDiagnosisFlow',
    inputSchema: GeneratePreliminaryDiagnosisInputSchema,
    outputSchema: GeneratePreliminaryDiagnosisOutputSchema,
  },
  async input => {
    // 1. Triage: Decide which specialists to call.
    const triageResult = await triagePrompt(input);
    const specialistsToCall = triageResult.output!.specialists as Specialist[];

    if (!specialistsToCall || specialistsToCall.length === 0) {
      return {
        diagnosis: "Nenhuma especialidade relevante foi identificada para este caso com base nos dados fornecidos.",
        suggestions: "Recomenda-se uma avaliação médica geral para determinar os próximos passos."
      }
    }

    // 2. Call only the selected specialist agents in parallel.
    const specialistPromises = specialistsToCall.map(specialistKey => {
      const agent = specialistAgents[specialistKey];
      return agent(input).then(report => ({
        specialist: specialistKey,
        findings: report.findings,
      }));
    });

    const specialistResults = await Promise.all(specialistPromises);

    // 3. Format the reports for the final synthesis prompt.
    const specialistReports = specialistResults.map(result => `
## ${result.specialist.charAt(0).toUpperCase() + result.specialist.slice(1)} Report:
${result.findings}
    `).join('\n');


    // 4. Call the synthesis prompt, feeding it only the relevant specialists' analyses.
    const {output} = await synthesisPrompt({
      ...input,
      specialistReports: specialistReports,
    });

    return output!;
  }
);
