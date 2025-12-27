'use server';
/**
 * @fileOverview AI flow for orchestrating a team of specialist agents to generate a preliminary diagnosis.
 *
 * - generatePreliminaryDiagnosis - Function that acts as a General Practitioner AI, coordinating specialists.
 * - GeneratePreliminaryDiagnosisInput - Input type for the function.
 * - GeneratePreliminaryDiagnosisOutput - Output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { countTextTokens } from '@/lib/token-counter';
import { trackAIUsage } from '@/lib/usage-tracker';
import {
  SpecialistAgentInputSchema,
  SpecialistAgentOutputSchema,
  type SpecialistAgentInput,
} from './specialist-agent-types';
import { cardiologistAgent } from './cardiologist-agent';
import { pulmonologistAgent } from './pulmonologist-agent';
import { radiologistAgent } from './radiologist-agent';
import { neurologistAgent } from './neurologist-agent';
import { gastroenterologistAgent } from './gastroenterologist-agent';
import { endocrinologistAgent } from './endocrinologist-agent';
import { dermatologistAgent } from './dermatologist-agent';
import { orthopedistAgent } from './orthopedist-agent';
import { ophthalmologistAgent } from './ophthalmologist-agent';
import { otolaryngologistAgent } from './otolaryngologist-agent';
import { nutritionistAgent } from './nutritionist-agent';
import { pediatricianAgent } from './pediatrician-agent';
import { gynecologistAgent } from './gynecologist-agent';
import { urologistAgent } from './urologist-agent';
import { psychiatristAgent } from './psychiatrist-agent';
import { rheumatologistAgent } from './rheumatologist-agent';
import { nephrologistAgent } from './nephrologist-agent';
import { oncologistAgent } from './oncologist-agent';
import { hematologistAgent } from './hematologist-agent';
import { infectologistAgent } from './infectologist-agent';
import { geriatricianAgent } from './geriatrician-agent';
import { angiologistAgent } from './angiologist-agent';
import { mastologistAgent } from './mastologist-agent';
import { allergistAgent } from './allergist-agent';
import { sportsDoctorAgent } from './sports-doctor-agent';
import { geneticistAgent } from './geneticist-agent';

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
  suggestedMedications: z.array(z.object({
    medication: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    route: z.string(),
    justification: z.string(),
  })).optional().describe("Medications suggested by this specialist with dosages and justification"),
  treatmentPlan: z.object({
    primaryTreatment: z.string().optional(),
    supportiveCare: z.string().optional(),
    lifestyleModifications: z.string().optional(),
    expectedOutcome: z.string().optional(),
  }).optional().describe("Treatment plan from this specialist"),
  monitoringProtocol: z.object({
    parameters: z.string().optional(),
    frequency: z.string().optional(),
    warningSignals: z.string().optional(),
  }).optional().describe("Monitoring protocol recommended by this specialist"),
  contraindications: z.array(z.string()).optional().describe("Contraindications noted by this specialist"),
  relevantMetrics: z.array(z.object({
    metric: z.string(),
    value: z.string(),
    status: z.enum(['normal', 'borderline', 'abnormal', 'critical']),
    interpretation: z.string(),
  })).optional().describe("Key clinical metrics identified by this specialist"),
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
  cardiologist: cardiologistAgent,
  endocrinologist: endocrinologistAgent,
  neurologist: neurologistAgent,
  pulmonologist: pulmonologistAgent,
  gastroenterologist: gastroenterologistAgent,
  dermatologist: dermatologistAgent,
  ophthalmologist: ophthalmologistAgent,
  orthopedist: orthopedistAgent,
  urologist: urologistAgent,
  gynecologist: gynecologistAgent,
  pediatrician: pediatricianAgent,
  otolaryngologist: otolaryngologistAgent,
  radiologist: radiologistAgent,
  psychiatrist: psychiatristAgent,
  nutritionist: nutritionistAgent,
  rheumatologist: rheumatologistAgent,
  nephrologist: nephrologistAgent,
  oncologist: oncologistAgent,
  hematologist: hematologistAgent,
  infectologist: infectologistAgent,
  geriatrician: geriatricianAgent,
  angiologist: angiologistAgent,
  mastologist: mastologistAgent,
  allergist: allergistAgent,
  sportsDoctor: sportsDoctorAgent,
  geneticist: geneticistAgent,
} as const;

type Specialist = keyof typeof specialistAgents;

const TRIAGE_PROMPT_TEMPLATE = `You are Dr. Márcio Silva, an elite General Practitioner AI and Medical Triage Specialist with 25+ years coordinating multidisciplinary teams. Your mission is to perform INTELLIGENT TRIAGE, selecting ONLY the specialists whose expertise is ABSOLUTELY CRITICAL for this specific case.

**🎯 YOUR CORE RESPONSIBILITY:**
Act as a precision filter - eliminate noise, maximize signal. Every specialist consultation has a cost (time, resources, patient anxiety). Choose wisely.

**📋 SPECIALIST SELECTION FRAMEWORK:**

**TIER 1 - IMMEDIATE CONSULTATION (Primary Findings):**
Select specialists when there are:
- Abnormal vital signs or lab values in their domain
- Explicit symptoms matching their specialty
- Critical/urgent findings requiring immediate expertise
- Documented disease in their area needing management

**TIER 2 - SECONDARY CONSULTATION (Differential Diagnosis):**
Select specialists when:
- Primary findings suggest comorbidities in their domain
- Symptoms overlap multiple specialties
- Patient history indicates risk factors they manage

**TIER 3 - EXCLUDE (No Current Indication):**
DO NOT select specialists when:
- No symptoms, signs, or lab abnormalities in their domain
- Patient data shows normal findings in their area
- Consultation would be purely "preventive screening" without specific risk factors
- Another specialist already covers the primary concern adequately

**🏥 AVAILABLE SPECIALIST AGENTS:**

**Primary Care & Internal Medicine:**
- cardiologist: Heart, circulation, blood pressure, cholesterol, cardiac imaging
- endocrinologist: Hormones, diabetes, thyroid, metabolic disorders, calcium/bone metabolism
- nephrologist: Kidneys, renal function, electrolytes, dialysis, urinary abnormalities
- gastroenterologist: Digestive system, liver, stomach, intestines, nutrition absorption

**Surgical & Procedural:**
- urologist: Urinary tract, prostate, male reproductive, kidney stones
- gynecologist: Female reproductive health, pregnancy, menstrual disorders, cervical/breast screening
- orthopedist: Bones, joints, muscles, fractures, arthritis, mobility issues

**Neurosciences & Mental Health:**
- neurologist: Brain, nerves, seizures, headaches, stroke, neuropathy, cognitive issues
- psychiatrist: Mental health, mood disorders, psychotropic medications, behavioral concerns

**Specialized Diagnostics:**
- radiologist: Imaging interpretation (X-ray, CT, MRI, ultrasound findings)
- ophthalmologist: Eyes, vision, retinal issues, glaucoma, diabetic eye disease
- otolaryngologist: Ears, nose, throat, hearing, sinus, voice/swallowing issues
- dermatologist: Skin, rashes, lesions, hair, nails

**Organ Systems:**
- pulmonologist: Lungs, breathing, oxygen levels, asthma, COPD, sleep apnea
- rheumatologist: Autoimmune diseases, arthritis, lupus, inflammatory conditions

**Lifestyle & Special Populations:**
- nutritionist: Diet, weight management, eating disorders, nutritional deficiencies
- pediatrician: Children/adolescent-specific conditions (use ONLY if patient is <18 years old)
- geriatrician: Elderly patients (>65y), frailty, falls risk, polypharmacy, cognitive decline

**Complex & Systemic Conditions:**
- oncologist: Cancer screening (PSA, CEA), suspicious nodules/masses (lung, breast, thyroid), weight loss + anemia
- hematologist: Anemia, leukopenia/leukocytosis, platelet disorders, coagulation, enlarged lymph nodes
- infectologist: Complex infections, HIV/Hepatitis/Syphilis, fever of unknown origin, multi-drug resistant organisms
- angiologist: Varicose veins, deep vein thrombosis (DVT), peripheral artery disease (poor circulation), diabetic foot

**Premium & Niche Specialties:**
- mastologist: Breast lumps, mammography findings, breast pain, nipple discharge (Female health focus)
- allergist: Recurrent rhinitis, asthma, hives (urticaria), suspected food/drug allergies, elevated IgE/Eosinophils
- sportsDoctor: Performance optimization, muscle recovery, overtraining, supplement advice (Wellness focus)
- geneticist: Family history of cancer, hereditary diseases, rare syndromes, genetic test interpretation

**📊 PATIENT DATA FOR ANALYSIS:**

**Exam Results:**
{{{examResults}}}

**Patient History & Symptoms:**
{{{patientHistory}}}

**🧠 SYSTEMATIC ANALYSIS PROTOCOL:**

**STEP 1 - IDENTIFY PRIMARY ABNORMALITIES:**
Scan the exam results for:
- Vital signs outside normal range (BP, HR, temp, SpO2, glucose)
- Lab values flagged as abnormal (high/low markers)
- Imaging findings indicating pathology
- Physical exam abnormalities

**STEP 2 - MAP FINDINGS TO ORGAN SYSTEMS:**
Group abnormalities by system:
- Cardiovascular → cardiologist
- Metabolic/Endocrine → endocrinologist
- Renal/Urinary → nephrologist, urologist
- Respiratory → pulmonologist
- Neurological → neurologist
- Gastrointestinal → gastroenterologist
- Musculoskeletal → orthopedist, rheumatologist
- Dermatological → dermatologist
- Reproductive → gynecologist, urologist
- Mental/Behavioral → psychiatrist, geriatrician (dementia)
- Hematologic/Oncologic → hematologist, oncologist
- Vascular/Circulatory → angiologist, cardiologist
- Infectious/Systemic → infectologist, allergist (immune)
- Breast Health → mastologist, gynecologist
- Performance/Lifestyle → sportsDoctor, nutritionist
- Hereditary/Genetic → geneticist

**STEP 3 - APPLY EXCLUSION CRITERIA:**
For each specialist, ask:
- "Is there CONCRETE EVIDENCE in the data requiring their expertise?"
- "Would their consultation CHANGE the diagnosis or treatment plan?"
- "Is this the RIGHT specialist, or would another cover this better?"

**STEP 4 - PRIORITIZE BY URGENCY:**
If >3 specialists needed, rank by:
1. Life-threatening findings (cardiac, respiratory, neurological emergencies)
2. Urgent chronic disease management (uncontrolled diabetes, severe hypertension)
3. Important but non-urgent (routine screening results, mild abnormalities)

**STEP 5 - FINAL SELECTION (2-4 specialists ideal, max 6):**
- Include specialists with DIRECT evidence in patient data
- Exclude specialists without specific findings
- Provide clear reasoning for inclusions AND exclusions

**⚠️ CRITICAL RULES:**

1. **Evidence Threshold**: Every selected specialist must have AT LEAST ONE specific abnormal finding, symptom, or documented condition in their domain.

2. **No "Just in Case" Referrals**: If imaging is normal, don't call radiologist. If mental health is stable, don't call psychiatrist.

3. **Age-Appropriate**: Only call pediatrician if patient is explicitly <18 years old.

4. **Avoid Redundancy**: If cardiologist covers hypertension, don't also call nephrologist UNLESS there's specific renal pathology.

5. **Quality over Quantity**: 2-3 highly relevant specialists > 8 marginally relevant ones.

**📝 OUTPUT FORMAT:**

Return a JSON object with:
- "specialists": Array of specialist keys (e.g., ["cardiologist", "endocrinologist"])
- "reasoning": Clear explanation like:
  "Selected cardiologist due to elevated BP (150/95) and abnormal ECG. Selected endocrinologist due to HbA1c 8.5% indicating uncontrolled diabetes. Excluded neurologist (no neurological symptoms), excluded gastroenterologist (digestive system exam normal)."

**🎯 REMEMBER:**
You are the gatekeeper of efficient, high-value medical care. Every specialist you select should be able to provide ACTIONABLE insights that directly impact diagnosis and treatment. Be ruthless in excluding unnecessary consultations.`;

const triagePrompt = ai.definePrompt({
  name: 'specialistTriagePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: GeneratePreliminaryDiagnosisInputSchema },
  output: {
    schema: z.object({
      specialists: z
        .array(z.enum(Object.keys(specialistAgents) as [Specialist, ...Specialist[]]))
        .describe(
          'A list of specialist agents to consult for this case, based on the patient data. Choose the most relevant specialists.'
        ),
      reasoning: z.string().describe('Brief explanation of why each specialist was selected and which specialists were explicitly excluded'),
    }),
  },
  prompt: TRIAGE_PROMPT_TEMPLATE,
});

const SYNTHESIS_PROMPT_TEMPLATE = `You are Dr. Márcio Silva, an experienced General Practitioner AI and Medical Coordinator.

**Your Mission:**
Create a CONCISE, ACTION-ORIENTED preliminary diagnosis. The doctor is busy and needs to scan for critical information quickly. **DO NOT WRITE NOVELS.** Use bullet points. Focus on what needs to be done.

**SYNTHESIS PRINCIPLES:**
1. **Brevity**: Be direct. Use short sentences and bullet points. Avoid flowery language.
2. **Action-First**: Put the most critical actions and findings at the very top.
3. **Evidence-Based**: **CITE SPECIFIC GUIDELINES** (e.g., SBC 2024, AHA, ADA, KDIGO, GOLD) for every major recommendation. This is crucial for trust.
4. **Safety**: Flag interactions and contraindications clearly.

**Patient Context:**

**History:**
{{{patientHistory}}}

**Exam Results:**
{{{examResults}}}

**Specialist Consultations:**
{{#each specialistReports}}
---
**{{specialist}}**
**Findings:** {{{findings}}}
**Assessment:** {{clinicalAssessment}}
**Recommendations:** {{{recommendations}}}
{{#if suggestedMedications}}
**Meds:**
{{#each suggestedMedications}}
- {{medication}} {{dosage}} {{frequency}} ({{justification}})
{{/each}}
{{/if}}
---
{{/each}}

**Your Tasks:**

**1. SYNTHESIS (Diagnóstico Preliminar) - EXECUTIVE SUMMARY:**

Structure strictly as follows:

**🚨 AÇÕES IMEDIATAS (Action Items):**
- List 3-5 most critical actions (medications to start, exams to order, referrals).
- Use clear, imperative verbs (ex: "Iniciar...", "Solicitar...", "Encaminhar...").

**📋 Resumo do Caso:**
- 1-2 paragraphs max summarizing the patient's status and primary diagnosis.
- Mention severity and urgency explicitly.

**🔍 Achados Críticos (Por Sistema):**
- Use bullet points.
- Only list **abnormal** or **relevant** findings. Skip normal systems.
- Example: "**Cardio**: PA 150/90 (Hipertensão E1) - *Ref: SBC 2020*"

**2. SUGGESTIONS (Conduta e Prescrição) - GUIDELINE-BASED:**

**💊 Plano Medicamentoso Sugerido:**
- List medications grouped by class.
- **MUST CITE GUIDELINE** for main drugs (ex: "Losartana 50mg (1ª linha HAS - SBC 2020)").
- Flag interactions clearly with "⚠️".

**🧪 Exames Complementares:**
- List prioritized exams with brief justification.

**👨‍⚕️ Encaminhamentos:**
- Who needs to see this patient and why.

**🥗 Estilo de Vida (Resumido):**
- Bullet points for Diet, Exercise, etc.

**⚠️ Sinais de Alerta:**
- When to return to ER.

**LANGUAGE & FORMAT:**
- Write in clear, professional Brazilian Portuguese.
- Use **Bold** for key values and drug names.
- Keep it scannable.`;

const synthesisPrompt = ai.definePrompt({
  name: 'diagnosisSynthesisPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {
    schema: z.object({
      patientHistory: z.string(),
      examResults: z.string(),
      specialistReports: z.array(
        z.object({
          specialist: z.string(),
          findings: z.string(),
          clinicalAssessment: z.string(),
          recommendations: z.string(),
          suggestedMedications: z.array(z.object({
            medication: z.string(),
            dosage: z.string(),
            frequency: z.string(),
            duration: z.string(),
            route: z.string(),
            justification: z.string(),
          })).optional(),
          treatmentPlan: z.object({
            primaryTreatment: z.string().optional(),
            supportiveCare: z.string().optional(),
            lifestyleModifications: z.string().optional(),
            expectedOutcome: z.string().optional(),
          }).optional(),
          monitoringProtocol: z.object({
            parameters: z.string().optional(),
            frequency: z.string().optional(),
            warningSignals: z.string().optional(),
          }).optional(),
          contraindications: z.array(z.string()).optional(),
          relevantMetrics: z.array(z.object({
            metric: z.string(),
            value: z.string(),
            status: z.enum(['normal', 'borderline', 'abnormal', 'critical']),
            interpretation: z.string(),
          })).optional(),
        })
      ),
    }),
  },
  output: { schema: z.object({ synthesis: z.string(), suggestions: z.string() }) },
  prompt: SYNTHESIS_PROMPT_TEMPLATE,
});


const generatePreliminaryDiagnosisFlow = ai.defineFlow(
  {
    name: 'generatePreliminaryDiagnosisFlow',
    inputSchema: GeneratePreliminaryDiagnosisInputSchema,
    outputSchema: GeneratePreliminaryDiagnosisOutputSchema,
  },
  async input => {
    const patientId = input.patientId;
    if (!patientId) {
      throw new Error("Patient ID is required for diagnosis generation.");
    }
    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║  🏥 SISTEMA DE ANÁLISE MULTI-ESPECIALISTA INICIADO   ║`);
    console.log(`╚════════════════════════════════════════════════════════╝\n`);

    // Step 1: Triage to decide which specialists to call.
    console.log(`[Triagem] 🎯 Analisando dados do exame para selecionar especialistas...`);
    console.log(`[Triagem] Dados do exame: ${input.examResults.substring(0, 200)}...`);

    const triageInputText = TRIAGE_PROMPT_TEMPLATE + JSON.stringify(input);
    const triageInputTokens = countTextTokens(triageInputText);
    
    const triageResult = await triagePrompt(input);
    const specialistsToCall = triageResult.output?.specialists || [];
    
    const triageOutputTokens = countTextTokens(JSON.stringify(triageResult.output));
    
    // Track Triage Usage
    await trackAIUsage({
      usageType: 'diagnosis',
      model: 'googleai/gemini-2.5-flash',
      inputTokens: triageInputTokens,
      outputTokens: triageOutputTokens,
      patientId,
      metadata: {
        feature: 'Medical Triage'
      }
    });

    console.log(`\n[Triagem] ✅ Triagem concluída`);
    console.log(`[Triagem] Raciocínio: ${triageResult.output?.reasoning || 'N/A'}`);
    console.log(`[Triagem] Especialistas selecionados: ${specialistsToCall.length}`);

    if (specialistsToCall.length === 0) {
      return {
        synthesis: 'Não foi possível determinar uma especialidade relevante para este caso.',
        suggestions: 'Recomenda-se uma avaliação clínica geral para determinar os próximos passos.',
        structuredFindings: [],
      };
    }

    // Step 2: Call the selected specialist agents in parallel WITH VALIDATION.
    console.log(`\n========================================`);
    console.log(`[Orchestrator] 🎯 INICIANDO ANÁLISE MULTI-ESPECIALISTA`);
    console.log(`[Orchestrator] Total de especialistas selecionados: ${specialistsToCall.length}`);
    console.log(`[Orchestrator] Especialistas: ${specialistsToCall.join(', ')}`);
    console.log(`========================================\n`);

    const specialistPromises = specialistsToCall.map(async (specialistKey, index) => {
      const agent = specialistAgents[specialistKey];
      const specialistName = specialistKey.charAt(0).toUpperCase() + specialistKey.slice(1);

      console.log(`\n--- [Especialista ${index + 1}/${specialistsToCall.length}] ---`);
      console.log(`[${specialistName}] 🩺 Iniciando análise...`);
      console.log(`[${specialistName}] 📊 Dados do exame recebidos: ${input.examResults.substring(0, 150)}...`);

      const startTime = Date.now();

      try {
        // Chama o especialista
        console.log(`[${specialistName}] 🧠 Processando análise especializada...`);
        const report = await agent(input);

        const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[${specialistName}] ⏱️ Análise concluída em ${analysisTime}s`);

        // Log dos achados principais
        console.log(`[${specialistName}] 📋 Achados principais:`);
        console.log(`  - Gravidade: ${report.clinicalAssessment}`);
        console.log(`  - Achados: ${report.findings.substring(0, 200)}...`);

        if (report.suggestedMedications && report.suggestedMedications.length > 0) {
          console.log(`  - Medicamentos sugeridos: ${report.suggestedMedications.length}`);
          report.suggestedMedications.forEach((med, i) => {
            console.log(`    ${i + 1}. ${med.medication} - ${med.dosage}`);
          });
        }

        if (report.relevantMetrics && report.relevantMetrics.length > 0) {
          console.log(`  - Métricas relevantes: ${report.relevantMetrics.length}`);
          report.relevantMetrics.forEach((metric, i) => {
            console.log(`    ${i + 1}. ${metric.metric}: ${metric.value} (${metric.status})`);
          });
        }

        // VALIDAÇÃO: Envia resposta para o agente validador
        console.log(`[${specialistName}] 🔍 Enviando para validação...`);
        const { validateSpecialistResponse } = await import('./validator-agent');
        const validationResult = await validateSpecialistResponse(
          specialistName,
          input,
          report,
          agent
        );

        if (!validationResult.validated) {
          console.error(`[${specialistName}] ❌ FALHA NA VALIDAÇÃO`);
          console.error(`[${specialistName}] Motivo: ${validationResult.error}`);
          console.error(`[${specialistName}] A análise será incluída com marcação de aviso`);

          // Ainda inclui o relatório, mas marca como não validado
          return {
            specialist: specialistKey,
            findings: report.findings + `\n\n[ATENÇÃO: Esta análise não passou na validação completa. Motivo: ${validationResult.error}]`,
            clinicalAssessment: report.clinicalAssessment,
            recommendations: report.recommendations,
            suggestedMedications: report.suggestedMedications,
            treatmentPlan: report.treatmentPlan,
            monitoringProtocol: report.monitoringProtocol,
            contraindications: report.contraindications,
            relevantMetrics: report.relevantMetrics,
          };
        }

        console.log(`[${specialistName}] ✅ VALIDAÇÃO APROVADA`);
        console.log(`[${specialistName}] Status: Análise completa e validada`);
        console.log(`--- [Fim ${specialistName}] ---\n`);

        return {
          specialist: specialistKey,
          findings: validationResult.response.findings,
          clinicalAssessment: validationResult.response.clinicalAssessment,
          recommendations: validationResult.response.recommendations,
          suggestedMedications: validationResult.response.suggestedMedications,
          treatmentPlan: validationResult.response.treatmentPlan,
          monitoringProtocol: validationResult.response.monitoringProtocol,
          contraindications: validationResult.response.contraindications,
          relevantMetrics: validationResult.response.relevantMetrics,
        };
      } catch (error) {
        console.error(`[${specialistName}] 💥 ERRO DURANTE ANÁLISE:`, error);
        throw error;
      }
    });

    const specialistReports = await Promise.all(specialistPromises);

    console.log(`\n========================================`);
    console.log(`[Orchestrator] ✅ ANÁLISE MULTI-ESPECIALISTA CONCLUÍDA`);
    console.log(`[Orchestrator] Total de relatórios coletados: ${specialistReports.length}`);
    console.log(`========================================\n`);

    // Step 3: Synthesize the reports into a final diagnosis.
    console.log(`\n[Síntese] 📊 Iniciando integração de todos os relatórios...`);
    console.log(`[Síntese] Consolidando ${specialistReports.length} relatórios especializados`);

    const synthesisInputText = SYNTHESIS_PROMPT_TEMPLATE + JSON.stringify({ ...input, specialistReports });
    const synthesisInputTokens = countTextTokens(synthesisInputText);

    const synthesisResult = await synthesisPrompt({
      ...input,
      specialistReports,
    });

    const synthesisOutputText = (synthesisResult.output!.synthesis || '') + (synthesisResult.output!.suggestions || '');
    const synthesisOutputTokens = countTextTokens(synthesisOutputText);

    // Track Synthesis Usage
    await trackAIUsage({
      usageType: 'diagnosis',
      model: 'googleai/gemini-2.5-flash',
      inputTokens: synthesisInputTokens,
      outputTokens: synthesisOutputTokens,
      patientId,
      metadata: {
        feature: 'Medical Diagnosis Synthesis'
      }
    });

    console.log(`[Síntese] ✅ Síntese concluída`);
    console.log(`[Síntese] Diagnóstico preliminar: ${synthesisResult.output!.synthesis.substring(0, 150)}...`);
    console.log(`[Síntese] Sugestões geradas: ${synthesisResult.output!.suggestions.substring(0, 150)}...`);

    // Token accounting for multi-specialist analysis
    // Note: This is logging only, real tracking is handled by trackAIUsage above
    const specialistCount = specialistReports.length;
    // Estimate tokens per specialist (conservative estimate for display)
    const tokensPerSpecialist = 4500; 
    const specialistTokens = specialistCount * tokensPerSpecialist;
    const totalTokens = triageInputTokens + triageOutputTokens + specialistTokens + synthesisInputTokens + synthesisOutputTokens;

    console.log(`[📊 Token Accounting] Multi-Specialist Analysis:`);
    console.log(`  - Specialists consulted: ${specialistCount}`);
    console.log(`  - Triage: ${triageInputTokens} input + ${triageOutputTokens} output`);
    console.log(`  - Specialists: ~${specialistTokens} tokens total (tracked individually)`);
    console.log(`  - Synthesis: ${synthesisInputTokens} input + ${synthesisOutputTokens} output`);
    console.log(`  - TOTAL ESTIMATED: ${totalTokens} tokens`);

    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║  ✅ ANÁLISE MULTI-ESPECIALISTA FINALIZADA COM SUCESSO ║`);
    console.log(`╚════════════════════════════════════════════════════════╝\n`);

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
