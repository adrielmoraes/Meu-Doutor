
/**
 * @fileOverview Defines the shared input and output schemas for all specialist AI agents.
 * This file centralizes the types to prevent circular dependencies.
 */

import {z} from 'genkit';

export const SpecialistAgentInputSchema = z.object({
  patientId: z.string().optional().describe("The patient ID for usage tracking."),
  examResults: z
    .string()
    .describe('The results of the medical exams as a single string.'),
  patientHistory: z
    .string()
    .describe('The patient medical history as a single string.'),
});
export type SpecialistAgentInput = z.infer<typeof SpecialistAgentInputSchema>;

export const SpecialistAgentOutputSchema = z.object({
  findings: z.string().describe("CONCISE clinical findings. Use bullet points. Focus strictly on abnormalities and relevant negatives."),
  clinicalAssessment: z.string().describe("Brief professional assessment of severity and urgency (1-2 sentences)."),
  recommendations: z.string().describe("Specific, actionable recommendations. Use bullet points. Be brief."),
  suggestedMedications: z.array(z.object({
    medication: z.string().describe("Nome do medicamento (princípio ativo e nome comercial quando aplicável)"),
    dosage: z.string().describe("Dosagem específica recomendada (ex: '50mg', '10mg/kg')"),
    frequency: z.string().describe("Frequência de administração (ex: '1x ao dia', '12/12h', 'conforme necessário')"),
    duration: z.string().describe("Duração do tratamento (ex: '7 dias', '3 meses', 'uso contínuo')"),
    route: z.string().describe("Via de administração (ex: 'oral', 'intravenosa', 'tópica')"),
    justification: z.string().describe("Justificativa clínica para prescrição deste medicamento"),
  })).optional().describe("Lista de medicamentos sugeridos com dosagens específicas. Deixe vazio se não houver indicação de medicação."),
  treatmentPlan: z.object({
    primaryTreatment: z.string().optional().describe("Tratamento principal recomendado (farmacológico ou não-farmacológico)"),
    supportiveCare: z.string().optional().describe("Medidas de suporte e cuidados complementares"),
    lifestyleModifications: z.string().optional().describe("Modificações de estilo de vida específicas"),
    expectedOutcome: z.string().optional().describe("Prognóstico esperado com o tratamento proposto"),
  }).optional().describe("Plano de tratamento detalhado. Deixe vazio se não for aplicável."),
  monitoringProtocol: z.object({
    parameters: z.string().optional().describe("Parâmetros a serem monitorados (ex: pressão arterial, glicemia, função renal)"),
    frequency: z.string().optional().describe("Frequência do monitoramento (ex: 'semanal', 'mensal', 'a cada 3 meses')"),
    warningSignals: z.string().optional().describe("Sinais de alerta que requerem atenção médica imediata"),
  }).optional().describe("Protocolo de monitoramento pós-tratamento"),
  contraindications: z.array(z.string()).optional().describe("Lista de contraindicações importantes relacionadas aos tratamentos sugeridos"),
  relevantMetrics: z.array(z.object({
    metric: z.string().describe("Name of the clinical metric or finding (e.g., 'Blood Pressure', 'ECG QT Interval')"),
    value: z.string().describe("The observed value or description"),
    status: z.enum(['normal', 'borderline', 'abnormal', 'critical']).describe("Clinical significance of this metric"),
    interpretation: z.string().describe("Detailed clinical interpretation of what this value means"),
  })).optional().describe("Key clinical metrics and their status, if applicable to this specialty."),
});
export type SpecialistAgentOutput = z.infer<typeof SpecialistAgentOutputSchema>;

export function createFallbackResponse(specialistName: string): SpecialistAgentOutput {
  return {
    findings: `[${specialistName}] O modelo de IA não conseguiu gerar uma análise estruturada para este exame. Por favor, consulte um profissional de saúde para avaliação completa.`,
    clinicalAssessment: 'Não foi possível determinar - análise requer revisão manual.',
    recommendations: 'Recomenda-se consulta presencial com especialista para análise detalhada dos resultados.',
    suggestedMedications: [],
    treatmentPlan: {
      primaryTreatment: 'A ser determinado após avaliação presencial.',
      supportiveCare: 'Manter acompanhamento regular.',
      lifestyleModifications: 'Seguir orientações gerais de saúde.',
      expectedOutcome: 'Prognóstico a ser determinado após avaliação completa.',
    },
    monitoringProtocol: {
      parameters: 'A serem definidos pelo especialista.',
      frequency: 'A ser definida após consulta.',
      warningSignals: 'Procurar atendimento médico em caso de sintomas agudos.',
    },
    contraindications: [],
    relevantMetrics: [],
  };
}
