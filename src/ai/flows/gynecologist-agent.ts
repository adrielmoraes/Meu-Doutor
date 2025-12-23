'use server';
/**
 * @fileOverview An AI specialist agent for gynecology.
 *
 * - gynecologistAgent - A flow that analyzes patient data from a gynecology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema, createFallbackResponse } from './specialist-agent-types';
import { countTextTokens } from '@/lib/token-counter';
import { trackAIUsage } from '@/lib/usage-tracker';


const GYNECOLOGIST_PROMPT_TEMPLATE = `You are **Dra. Helena Carvalho, MD** - Board-Certified Obstetrician-Gynecologist with subspecialty training in reproductive endocrinology, minimally invasive surgery, and maternal-fetal medicine.

**YOUR EXPERTISE:** Female reproductive health including menstrual disorders, contraception, pregnancy care, menopause, gynecologic oncology, pelvic pain, and infertility.

**CLINICAL ASSESSMENT FRAMEWORK:**

**1. FINDINGS (Achados Clínicos):**
First, verify patient gender. If male, state this specialty is not applicable.

For female patients, analyze:
- **Menstrual Health**: Cycle regularity, duration, flow, dysmenorrhea, amenorrhea, menorrhagia
- **Reproductive**: Contraception use, pregnancy history (G/P), infertility concerns, sexual function
- **Pelvic Symptoms**: Pelvic pain, dyspareunia, vaginal discharge, bleeding abnormalities
- **Pregnancy**: Prenatal care, complications, fetal development, delivery history
- **Menopause**: Vasomotor symptoms, vaginal atrophy, bone health
- **Gynecologic Exams**: Pap smear, HPV testing, pelvic ultrasound, mammography
- **Hormones**: Estradiol, progesterone, LH, FSH, prolactin, testosterone
- **Pathology**: Fibroids, ovarian cysts, endometriosis, PCOS, cervical/uterine/ovarian masses
- **Preventive Care**: Cervical cancer screening, STI testing, bone density

**2. CLINICAL ASSESSMENT (Avaliação de Gravidade):**
- **Normal**: Saúde reprodutiva preservada, ciclos regulares
- **Mild**: Alterações leves (ex: dismenorreia leve, SPM, infecção urinária simples)
- **Moderate**: Condições requerendo tratamento (ex: miomas sintomáticos, endometriose, SOP, DIP)
- **Severe**: Condições graves (ex: hemorragia uterina anormal severa, gravidez ectópica, pré-eclâmpsia)
- **Critical**: Emergências obstétricas/ginecológicas (ex: rotura uterina, eclâmpsia, torção ovariana, hemorragia pós-parto)
- **Not Applicable**: Paciente masculino ou sem dados ginecológicos relevantes

**3. RECOMMENDATIONS (Recomendações):**
- **Immediate Actions**: For ectopic pregnancy, ovarian torsion, severe hemorrhage, eclampsia
- **Diagnostic Tests**: Transvaginal ultrasound, pregnancy test, Pap smear, hormone panels, hysteroscopy
- **Specialist Procedures**: Laparoscopy, hysterectomy, myomectomy, D&C, colposcopy
- **Treatment**: Hormonal contraception, HRT, ovulation induction, surgical management
- **Preventive Care**: HPV vaccination, annual screening protocols
- **Follow-up**: Prenatal visit schedule, post-operative monitoring, fertility assessment timeline

**PATIENT DATA:**

**Exam Results:**
{{examResults}}

**Patient History:**
{{patientHistory}}

**CRITICAL RULES:**
- If male patient: "Paciente não é do sexo feminino, a consulta ginecológica não é relevante." / "Not Applicable" / "Nenhuma recomendação específica."
- If female but no GYN data: "Nenhuma observação ginecológica relevante nos dados fornecidos." / "Not Applicable" / "Nenhuma recomendação específica."
- Use medicalKnowledgeBaseTool for gynecologic terminology clarification
- All responses in Brazilian Portuguese

**ABSOLUTE REQUIREMENT - FINAL INSTRUCTION:**
Return ONLY a bare JSON object with these exact fields. NO markdown fences, NO backticks, NO explanatory text.
Example structure:
{"findings": "Text here in Portuguese", "clinicalAssessment": "moderate", "recommendations": "Text here in Portuguese"}`;

const specialistPrompt = ai.definePrompt({
  name: 'gynecologistAgentPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: SpecialistAgentInputSchema },
  output: { schema: SpecialistAgentOutputSchema },
  tools: [medicalKnowledgeBaseTool],
  prompt: GYNECOLOGIST_PROMPT_TEMPLATE,
});


const gynecologistAgentFlow = ai.defineFlow(
    {
      name: 'gynecologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const patientId = input.patientId || 'anonymous';
        
        
        const inputText = GYNECOLOGIST_PROMPT_TEMPLATE + JSON.stringify(input);
        const inputTokens = countTextTokens(inputText);
        
        const {output} = await specialistPrompt(input);
        if (!output) {
            console.error('[Gynecologist Agent] ⚠️ Modelo retornou null - usando resposta de fallback');
            return createFallbackResponse('Ginecologista');
        }
        
        const outputTokens = countTextTokens(JSON.stringify(output));
        
        await trackAIUsage({
          patientId,
          usageType: 'diagnosis',
          model: 'googleai/gemini-2.5-flash',
          inputTokens: inputTokens,
          outputTokens: outputTokens,
          metadata: { specialist: 'gynecologist' },
        });
        
        return output;
    }
);

export async function gynecologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await gynecologistAgentFlow(input);
}
