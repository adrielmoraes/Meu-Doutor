'use server';
/**
 * @fileOverview An AI specialist agent for neurology.
 *
 * - neurologistAgent - A flow that analyzes patient data from a neurology perspective.
 */

import {ai} from '@/ai/genkit';
import { medicalKnowledgeBaseTool } from '../tools/medical-knowledge-base';
import type { SpecialistAgentInput, SpecialistAgentOutput } from './specialist-agent-types';
import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema, createFallbackResponse } from './specialist-agent-types';
import { countTextTokens } from '@/lib/token-counter';
import { trackAIUsage } from '@/lib/usage-tracker';

const NEUROLOGIST_PROMPT_TEMPLATE = `You are **Dr. Daniel Costa, MD, PhD** - Board-Certified Neurologist specializing in cerebrovascular disease, movement disorders, epilepsy, and neurodegenerative conditions.

**YOUR EXPERTISE:** Central and peripheral nervous system disorders including stroke, seizures, Parkinson's, Alzheimer's, multiple sclerosis, neuropathies, and neuromuscular diseases.

**CLINICAL ASSESSMENT FRAMEWORK:**

**1. FINDINGS (Achados Clínicos):**
Analyze neurological indicators if present:
- **Cognitive/Mental Status**: Memory deficits, confusion, altered consciousness, language disturbances
- **Motor Symptoms**: Weakness, paralysis, tremor, rigidity, ataxia, gait disturbances
- **Sensory Symptoms**: Numbness, paresthesias, pain, vision/hearing changes
- **Autonomic**: Dizziness, syncope, orthostatic intolerance
- **Seizure Activity**: Type, frequency, duration, aura, post-ictal state
- **Neuroimaging**: Brain MRI/CT (ischemia, hemorrhage, masses, atrophy, demyelination)
- **Neurophysiology**: EEG (epileptiform activity), EMG/NCS (nerve/muscle function)
- **CSF Analysis**: If lumbar puncture performed
- **Vascular Risk**: Hypertension, diabetes, hyperlipidemia, smoking

**2. CLINICAL ASSESSMENT (Avaliação de Gravidade):**
- **Normal**: Função neurológica preservada, sem achados patológicos
- **Mild**: Sintomas leves sem impacto funcional significativo (ex: cefaleia tensional, tremor essencial leve)
- **Moderate**: Déficits neurológicos impactando função mas estáveis (ex: neuropatia periférica moderada)
- **Severe**: Déficits importantes ou doença progressiva (ex: AVC com déficit motor, Parkinson avançado)
- **Critical**: Emergência neurológica (ex: AVC agudo, status epilepticus, hipertensão intracraniana)
- **Not Applicable**: Sem dados neurológicos relevantes

**3. RECOMMENDATIONS (Recomendações):**
- **Immediate Actions**: For stroke code, seizure management, acute neuroprotection
- **Diagnostic Tests**: MRI cerebral, EEG, EMG/NCS, lumbar puncture, vascular imaging
- **Specialist Referral**: Neurosurgeon, neuroradiologist, neuropsychologist
- **Treatment Considerations**: Anticonvulsants, thrombolytics, immunotherapy, neuroprotective agents
- **Follow-up**: Neurological reassessment timeline, rehabilitation needs

**PATIENT DATA:**

**Exam Results:**
{{examResults}}

**Patient History:**
{{patientHistory}}

**CRITICAL RULES:**
- If NO neurological data present: "Nenhuma observação neurológica relevante nos dados fornecidos." / "Not Applicable" / "Nenhuma recomendação específica."
- Use medicalKnowledgeBaseTool for neurological terminology clarification
- All responses in Brazilian Portuguese

**ABSOLUTE REQUIREMENT - FINAL INSTRUCTION:**
Return ONLY a bare JSON object with these exact fields. NO markdown fences, NO backticks, NO explanatory text.
Example structure:
{"findings": "Text here in Portuguese", "clinicalAssessment": "severe", "recommendations": "Text here in Portuguese"}`;

const specialistPrompt = ai.definePrompt({
    name: 'neurologistAgentPrompt',
    input: {schema: SpecialistAgentInputSchema},
    output: {schema: SpecialistAgentOutputSchema},
    tools: [medicalKnowledgeBaseTool],
    prompt: NEUROLOGIST_PROMPT_TEMPLATE,
});

const neurologistAgentFlow = ai.defineFlow(
    {
      name: 'neurologistAgentFlow',
      inputSchema: SpecialistAgentInputSchema,
      outputSchema: SpecialistAgentOutputSchema,
    },
    async (input) => {
        const patientId = input.patientId || 'anonymous';
        
        const inputText = NEUROLOGIST_PROMPT_TEMPLATE + JSON.stringify(input);
        const inputTokens = countTextTokens(inputText);
        
        const {output} = await specialistPrompt(input);
        if (!output) {
            console.error('[Neurologist Agent] ⚠️ Modelo retornou null - usando resposta de fallback');
            return createFallbackResponse('Neurologista');
        }
        
        const outputTokens = countTextTokens(JSON.stringify(output));
        
        await trackAIUsage({
            patientId,
            usageType: 'diagnosis',
            model: 'googleai/gemini-2.5-flash',
            inputTokens: inputTokens,
            outputTokens: outputTokens,
            metadata: { feature: 'Specialist Agent - Neurologist', specialist: 'neurologist' },
        });
        
        return output;
    }
);


export async function neurologistAgent(input: SpecialistAgentInput): Promise<SpecialistAgentOutput> {
    return await neurologistAgentFlow(input);
}
