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
import { rheumatologistAgent } from './rheumatologist-agent';
import { nephrologistAgent } from './nephrologist-agent';

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
} as const;

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
      reasoning: z.string().describe('Brief explanation of why each specialist was selected and which specialists were explicitly excluded'),
    }),
  },
  prompt: `You are Dr. Márcio Silva, an elite General Practitioner AI and Medical Triage Specialist with 25+ years coordinating multidisciplinary teams. Your mission is to perform INTELLIGENT TRIAGE, selecting ONLY the specialists whose expertise is ABSOLUTELY CRITICAL for this specific case.

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
- Mental/Behavioral → psychiatrist

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
You are the gatekeeper of efficient, high-value medical care. Every specialist you select should be able to provide ACTIONABLE insights that directly impact diagnosis and treatment. Be ruthless in excluding unnecessary consultations.`,
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

**CRITICAL FORMATTING RULES:**
- "synthesis": Must be a PLAIN TEXT string with proper formatting (use \n for line breaks, - for bullets)
- "suggestions": Must be a PLAIN TEXT string with proper formatting (use \n for line breaks, - for bullets, ** for bold sections)
- DO NOT return nested JSON objects or arrays inside these fields
- Format sections with clear headings using **Section Name:** followed by content
- Use bullet points with "- " prefix for lists
- Use double line breaks (\n\n) to separate major sections

Example structure:
{
  "synthesis": "**A. Resumo Executivo:**\n- Diagnóstico primário: Hipercolesterolemia\n- Gravidade: Moderada\n\n**B. Achados Principais por Sistema:**\n...",
  "suggestions": "**A. PLANO MEDICAMENTOSO INTEGRADO:**\n\n**Medicamentos Cardiovasculares:**\n- Atorvastatina 40mg 1x/dia VO à noite (hipolipemiante - alvo LDL <70mg/dL)\n\n**B. EXAMES COMPLEMENTARES PRIORIZADOS:**\n\n**Urgentes (próxima semana):**\n- Perfil lipídico completo (justificativa: confirmar diagnóstico)\n..."
}`,
});


const generatePreliminaryDiagnosisFlow = ai.defineFlow(
  {
    name: 'generatePreliminaryDiagnosisFlow',
    inputSchema: GeneratePreliminaryDiagnosisInputSchema,
    outputSchema: GeneratePreliminaryDiagnosisOutputSchema,
  },
  async input => {
    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║  🏥 SISTEMA DE ANÁLISE MULTI-ESPECIALISTA INICIADO   ║`);
    console.log(`╚════════════════════════════════════════════════════════╝\n`);
    
    // Step 1: Triage to decide which specialists to call.
    console.log(`[Triagem] 🎯 Analisando dados do exame para selecionar especialistas...`);
    console.log(`[Triagem] Dados do exame: ${input.examResults.substring(0, 200)}...`);
    
    const triageResult = await triagePrompt(input);
    const specialistsToCall = triageResult.output?.specialists || [];
    
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
        const {validateSpecialistResponse} = await import('./validator-agent');
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
    
    const synthesisResult = await synthesisPrompt({
      ...input,
      specialistReports,
    });

    console.log(`[Síntese] ✅ Síntese concluída`);
    console.log(`[Síntese] Diagnóstico preliminar: ${synthesisResult.output!.synthesis.substring(0, 150)}...`);
    console.log(`[Síntese] Sugestões geradas: ${synthesisResult.output!.suggestions.substring(0, 150)}...`);
    
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
