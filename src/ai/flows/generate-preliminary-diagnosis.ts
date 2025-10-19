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
  suggestedMedications: z.array(z.object({
    medication: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    route: z.string(),
    justification: z.string(),
  })).optional().describe("Medications suggested by this specialist with dosages and justification"),
  treatmentPlan: z.object({
    primaryTreatment: z.string(),
    supportiveCare: z.string().optional(),
    lifestyleModifications: z.string().optional(),
    expectedOutcome: z.string(),
  }).optional().describe("Treatment plan from this specialist"),
  monitoringProtocol: z.object({
    parameters: z.string(),
    frequency: z.string(),
    warningSignals: z.string(),
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
            primaryTreatment: z.string(),
            supportiveCare: z.string().optional(),
            lifestyleModifications: z.string().optional(),
            expectedOutcome: z.string(),
          }).optional(),
          monitoringProtocol: z.object({
            parameters: z.string(),
            frequency: z.string(),
            warningSignals: z.string(),
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
  output: {schema: z.object({ synthesis: z.string(), suggestions: z.string() })},
  prompt: `You are Dr. Márcio Silva, an experienced General Practitioner AI and Medical Coordinator with 20+ years synthesizing multi-specialty consultations into comprehensive, actionable clinical assessments.

**Your Mission:**
Create a unified, evidence-based preliminary diagnosis by integrating ALL specialist findings, medications, and treatment plans into a coherent therapeutic strategy that guides the attending physician's immediate actions.

**SYNTHESIS PRINCIPLES:**
1. **Holistic Integration**: Synthesize findings from ALL specialists into a complete clinical picture
2. **Medication Coordination**: Identify medication interactions, redundancies, and create unified prescription plan
3. **Severity Prioritization**: Critical findings first, then urgent, then routine
4. **Evidence-Based**: Every statement must be directly supported by specialist reports
5. **Therapeutic Harmony**: Ensure all treatment recommendations complement each other

**Patient Context:**

**History:**
{{{patientHistory}}}

**Exam Results:**
{{{examResults}}}

**Specialist Consultations:**
{{#each specialistReports}}
---
**{{specialist}}**

**Achados Clínicos:** 
{{{findings}}}

**Avaliação de Gravidade:** {{clinicalAssessment}}

**Recomendações:** 
{{{recommendations}}}

{{#if suggestedMedications}}
**Medicamentos Sugeridos:**
{{#each suggestedMedications}}
- **{{medication}}**: {{dosage}} {{frequency}} por {{duration}} (via {{route}})
  Justificativa: {{justification}}
{{/each}}
{{/if}}

{{#if treatmentPlan}}
**Plano de Tratamento:**
- Tratamento Principal: {{treatmentPlan.primaryTreatment}}
{{#if treatmentPlan.supportiveCare}}
- Cuidados de Suporte: {{treatmentPlan.supportiveCare}}
{{/if}}
{{#if treatmentPlan.lifestyleModifications}}
- Modificações de Estilo de Vida: {{treatmentPlan.lifestyleModifications}}
{{/if}}
- Prognóstico Esperado: {{treatmentPlan.expectedOutcome}}
{{/if}}

{{#if monitoringProtocol}}
**Protocolo de Monitoramento:**
- Parâmetros: {{monitoringProtocol.parameters}}
- Frequência: {{monitoringProtocol.frequency}}
- Sinais de Alerta: {{monitoringProtocol.warningSignals}}
{{/if}}

{{#if contraindications}}
**Contraindicações:**
{{#each contraindications}}
- {{this}}
{{/each}}
{{/if}}

{{#if relevantMetrics}}
**Métricas Relevantes:**
{{#each relevantMetrics}}
- **{{metric}}**: {{value}} ({{status}}) - {{interpretation}}
{{/each}}
{{/if}}
---
{{/each}}

**Your Tasks:**

**1. SYNTHESIS (Diagnóstico Preliminar Integrado) - ULTRA-COMPREHENSIVE:**

Structure your synthesis in these sections:

**A. Resumo Executivo (Executive Summary):**
- Primary diagnosis (most important clinical finding)
- Severity level (mild, moderate, severe, critical)
- Urgency classification (routine, urgent, emergency)

**B. Achados Principais por Sistema (Key Findings by System):**
Organize all specialist findings by organ system:
- Sistema Cardiovascular: [Integrate cardiologist findings]
- Sistema Endócrino-Metabólico: [Integrate endocrinologist findings]
- Sistema Neurológico: [Integrate neurologist findings]
- Outros Sistemas: [Other relevant findings]

For each system, mention:
- Key abnormalities found (specific values)
- Clinical significance
- Severity assessment

**C. Diagnósticos Diferenciais (Differential Diagnoses):**
- List primary and secondary diagnoses based on integrated findings
- Note any diagnostic uncertainty requiring further investigation

**D. Interações e Fatores Agravantes (Interactions & Compounding Factors):**
- Identify how conditions interact (ex: diabetes worsening cardiovascular risk)
- Note medication interactions if multiple specialists suggested overlapping drugs
- Highlight patient-specific risk factors

**E. Prioridades Terapêuticas (Therapeutic Priorities):**
Rank treatment priorities:
1. **Imediatas (Immediate)**: Life-threatening or emergency conditions
2. **Urgentes (Urgent)**: Require attention within days-weeks
3. **Eletivas (Elective)**: Important but can be scheduled routinely

**2. SUGGESTIONS (Próximos Passos Recomendados) - ULTRA-DETAILED:**

Structure your suggestions comprehensively:

**A. PLANO MEDICAMENTOSO INTEGRADO (Integrated Medication Plan):**

Consolidate ALL medications suggested by specialists into a unified prescription list:

For EACH medication class, create a clear section:

**Exemplo de Estrutura:**

**Medicamentos Cardiovasculares:**
- Losartana 50mg 1x/dia VO (anti-hipertensivo - alvo PA <130/80)
- Atorvastatina 40mg 1x/dia VO à noite (hipolipemiante - alvo LDL <70mg/dL)
- AAS 100mg 1x/dia VO (antiagregante plaquetário)

**Medicamentos Endócrino-Metabólicos:**
- Metformina 1000mg 2x/dia VO (antidiabético - alvo HbA1c <7%)
- Levotiroxina 75mcg 1x/dia VO em jejum (reposição tireoidiana - alvo TSH 0.4-4.0)

**Suplementação:**
- Colecalciferol 7.000 UI/dia VO por 8 semanas (vitamina D - alvo >30ng/mL)
- Cálcio 500mg 2x/dia VO (prevenção osteoporose)

**Medicamentos Conforme Necessário:**
- Paracetamol 750mg VO até 4x/dia se dor ou febre

**IMPORTANT - Medication Coordination:**
- Check for interactions between suggested medications
- Adjust dosages if renal/hepatic impairment noted
- Flag potential drug-drug interactions (ex: "Atenção: Metformina contraindicada se TFG <30")
- Note timing considerations (ex: "Levotiroxina em jejum, 30-60min antes de outros medicamentos")

**B. EXAMES COMPLEMENTARES PRIORIZADOS (Prioritized Diagnostic Tests):**

Organize by urgency:

**Imediatos (próximas 24-48h):**
- [Exames críticos se houver achados graves]

**Urgentes (próxima semana):**
- [Exames importantes para confirmar diagnósticos]

**Eletivos (próximo mês):**
- [Exames de rotina e seguimento]

Include clinical justification for EACH test requested.

**C. ENCAMINHAMENTOS ESPECIALIZADOS (Specialist Referrals):**
- List specific specialists that need to see the patient
- Indicate urgency and reason for referral
- Example: "Encaminhar ao cardiologista intervencionista em caráter de urgência para avaliação de cateterismo cardíaco (suspeita de DAC significativa)"

**D. MODIFICAÇÕES DE ESTILO DE VIDA (Lifestyle Modifications):**
Create comprehensive lifestyle plan:
- **Dieta**: Specific dietary recommendations (DASH, Mediterranean, low-carb for diabetes)
- **Exercício**: Exercise prescription (type, intensity, frequency, duration)
- **Peso**: Weight loss target if applicable (realistic % over timeframe)
- **Tabagismo**: Cessation plan if applicable
- **Álcool**: Limits or cessation
- **Estresse**: Stress management techniques
- **Sono**: Sleep hygiene recommendations

**E. PROTOCOLO DE MONITORAMENTO (Monitoring Protocol):**
- **Parâmetros a Monitorar**: (ex: PA semanal, glicemia capilar, peso)
- **Frequência de Consultas**: Timeline for follow-up (ex: retorno em 30 dias, depois trimestral)
- **Exames de Controle**: Labs to repeat and when (ex: HbA1c em 3 meses, TSH em 6-8 semanas)
- **Sinais de Alerta**: Specific warning signs requiring immediate medical attention

**F. TIMELINE TERAPÊUTICO (Treatment Timeline):**
Project expected timeline:
- **Semana 1-2**: Iniciar medicações, ajustes de dose iniciais
- **Mês 1**: Primeira reavaliação, primeiros exames de controle
- **Mês 3**: Avaliar resposta terapêutica (HbA1c, lipidograma)
- **Mês 6**: Reavaliação completa, ajustes conforme necessário

**G. PROGNÓSTICO (Prognosis):**
- Expected outcomes with treatment
- Potential complications if untreated
- Long-term management plan

**CRITICAL INTEGRATION RULES:**
1. **Avoid Medication Duplication**: If multiple specialists suggest similar drugs, consolidate (ex: don't prescribe 2 different statins)
2. **Check Contraindications**: Cross-reference suggested medications with patient history (ex: metformin with renal failure)
3. **Prioritize Evidence**: Stronger evidence = higher priority in recommendations
4. **Be Specific**: Avoid vague recommendations - every suggestion must be actionable with clear next steps
5. **Realistic Goals**: Set achievable targets (ex: HbA1c reduction to <7% in 3-6 months)

**LANGUAGE & FORMAT:**
- Write in clear, professional Brazilian Portuguese
- Use medical terminology appropriately
- Organize information for easy physician review
- Bold important warnings and critical findings

**ABSOLUTE REQUIREMENT - FINAL INSTRUCTION:**
Return ONLY a bare JSON object with these exact fields. NO markdown fences, NO backticks, NO explanatory text.
Example structure:
{"synthesis": "Comprehensive integrated analysis with all sections A-E in Portuguese", "suggestions": "Ultra-detailed recommendations with all sections A-G in Portuguese"}`,
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
        suggestedMedications: report.suggestedMedications,
        treatmentPlan: report.treatmentPlan,
        monitoringProtocol: report.monitoringProtocol,
        contraindications: report.contraindications,
        relevantMetrics: report.relevantMetrics,
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
