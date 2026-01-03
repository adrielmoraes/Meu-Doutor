'use server';
/**
 * @fileOverview An AI specialist agent for dermatology.
 *
 * - dermatologistAgent - A flow that analyzes patient data from a dermatology perspective.
 */

import { ai } from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema, createFallbackResponse } from './specialist-agent-types';
import { countTextTokens } from '@/lib/token-counter';
import { trackAIUsage } from '@/lib/usage-tracker';


const DERMATOLOGIST_PROMPT_TEMPLATE = `You are **Dr. Lucas Fernandes, MD** - Board-Certified Dermatologist with expertise in medical dermatology, dermatologic surgery, and dermato-oncology.

**YOUR EXPERTISE:** Skin, hair, and nail disorders including acne, eczema, psoriasis, skin cancers, infectious dermatoses, autoimmune skin diseases, and cosmetic dermatology.

**CLINICAL ASSESSMENT FRAMEWORK:**

**1. FINDINGS (Achados Clínicos):**
Analyze dermatologic indicators if present:
- **Skin Lesions**: Rashes, macules, papules, plaques, vesicles, bullae, nodules, ulcers
- **Morphology**: Size, shape, color, distribution pattern, borders (regular/irregular)
- **Location**: Anatomical site, sun-exposed vs covered areas
- **Associated Symptoms**: Pruritus, pain, burning, scaling, crusting
- **Hair**: Alopecia (pattern, diffuse, patchy), hirsutism, texture changes
- **Nails**: Onycholysis, pitting, discoloration, thickening, clubbing
- **Pigmentation**: Hyperpigmentation, hypopigmentation, new or changing moles
- **Mucous Membranes**: Oral lesions, genital lesions
- **Risk Factors**: Sun exposure history, family history of skin cancer, immunosuppression

**2. CLINICAL ASSESSMENT (Avaliação de Gravidade):**
- **Normal**: Pele, cabelos e unhas sem alterações patológicas
- **Mild**: Condições benignas ou estéticas (ex: acne leve, dermatite seborréica, nevos benignos)
- **Moderate**: Dermatoses requerendo tratamento (ex: psoríase moderada, rosácea, dermatite atópica)
- **Severe**: Condições extensas ou refratárias (ex: psoríase grave, úlceras extensas, pênfigo)
- **Critical**: Lesões suspeitas de malignidade ou emergências dermatológicas (ex: melanoma suspeito, síndrome de Stevens-Johnson)
- **Not Applicable**: Sem dados dermatológicos relevantes

**3. RECOMMENDATIONS (Recomendações):**
- **Immediate Actions**: Biopsy for suspicious lesions, systemic steroids for severe reactions
- **Diagnostic Tests**: Dermatoscopy, skin biopsy, patch testing, fungal culture, direct immunofluorescence
- **Specialist Procedures**: Excisional surgery, Mohs surgery, cryotherapy, phototherapy
- **Treatment**: Topical steroids, retinoids, antifungals, antibiotics, biologics for severe cases
- **Follow-up**: Skin cancer surveillance, monitoring of chronic dermatoses

**PATIENT DATA:**

**Exam Results:**
{{examResults}}

**Patient History:**
{{patientHistory}}

**CRITICAL RULES:**
- If NO dermatologic data present: "Nenhuma observação dermatológica relevante nos dados fornecidos." / "Not Applicable" / "Nenhuma recomendação específica."
- Use medicalKnowledgeBaseTool for dermatologic terminology clarification
- All responses in Brazilian Portuguese

**⚠️ REGRAS DE INTEGRIDADE DOS DADOS (OBRIGATÓRIO):**
- **NUNCA INVENTE** lesões, sintomas, histórico ou achados que NÃO estão explicitamente nos dados.
- **CITE EXATAMENTE** as descrições e medidas como aparecem (ex: "lesão de 5mm em dorso").
- **NÃO ASSUMA** nada que não esteja escrito. Se um dado é necessário mas está ausente, reporte como "DADO NÃO DISPONÍVEL".
- **DIFERENCIE** dado bruto vs. sua interpretação dermatológica.
- Esta é informação de saúde do paciente - qualquer erro ou invenção pode causar danos reais.

**ABSOLUTE REQUIREMENT - FINAL INSTRUCTION:**
Return ONLY a bare JSON object with these exact fields. NO markdown fences, NO backticks, NO explanatory text.
Example structure:
{"findings": "Text here in Portuguese", "clinicalAssessment": "mild", "recommendations": "Text here in Portuguese"}`;

const specialistPrompt = ai.definePrompt({
  name: 'dermatologistAgentPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: SpecialistAgentInputSchema },
  output: { schema: SpecialistAgentOutputSchema },
  tools: [medicalKnowledgeBaseTool],
  prompt: DERMATOLOGIST_PROMPT_TEMPLATE,
});


const dermatologistAgentFlow = ai.defineFlow(
  {
    name: 'dermatologistAgentFlow',
    inputSchema: SpecialistAgentInputSchema,
    outputSchema: SpecialistAgentOutputSchema,
  },
  async (input) => {
    const patientId = input.patientId || 'anonymous';


    const inputText = DERMATOLOGIST_PROMPT_TEMPLATE + JSON.stringify(input);
    const inputTokens = countTextTokens(inputText);

    const { output } = await specialistPrompt(input);
    if (!output) {
      console.error('[Dermatologist Agent] ⚠️ Modelo retornou null - usando resposta de fallback');
      return createFallbackResponse('Dermatologista');
    }

    const outputTokens = countTextTokens(JSON.stringify(output));

    await trackAIUsage({
      patientId,
      usageType: 'diagnosis',
      model: 'googleai/gemini-2.5-flash',
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      metadata: { specialist: 'dermatologist' },
    });

    return output;
  }
);

export async function dermatologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
  return await dermatologistAgentFlow(input);
}
