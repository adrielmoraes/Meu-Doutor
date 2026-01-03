"use server";

/**
 * @fileOverview AI flow for therapist chat with comprehensive patient data access
 *
 * This flow implements an AI therapist that has access to:
 * - Patient medical history
 * - All exam results and diagnoses
 * - Wellness plans
 * - Conversation history
 * - Doctor search and appointment scheduling
 *
 * It acts as both a therapist and personal health assistant
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { getPatientById, getExamsByPatientId, getDoctors } from "@/lib/db-adapter";
import { trackChatMessage } from "@/lib/usage-tracker";

const TherapistChatInputSchema = z.object({
  patientId: z.string().describe("The unique identifier for the patient"),
  message: z.string().describe("The patient message or question"),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .describe("Previous messages in the conversation"),
});

export type TherapistChatInput = z.infer<typeof TherapistChatInputSchema>;

const TherapistChatOutputSchema = z.object({
  response: z
    .string()
    .describe("The therapist AI empathetic and helpful response"),
});

export type TherapistChatOutput = z.infer<typeof TherapistChatOutputSchema>;

export async function therapistChat(
  input: TherapistChatInput,
): Promise<TherapistChatOutput> {
  return therapistChatFlow(input);
}

async function getPatientContext(patientId: string): Promise<string> {
  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
      return "Paciente não encontrado.";
    }

    const exams = await getExamsByPatientId(patientId);

    let context = `INFORMAÇÕES DO PACIENTE:
Nome: ${patient.name}
Idade: ${patient.age} anos
Email: ${patient.email}
Status de Saúde: ${patient.status}
`;

    if (patient.reportedSymptoms) {
      context += `\nSintomas Reportados: ${patient.reportedSymptoms}`;
    }

    if (patient.conversationHistory) {
      context += `\n\nHistórico de Conversas Anteriores:
${patient.conversationHistory.substring(0, 500)}...`;
    }

    if (exams.length > 0) {
      context += `\n\nHISTÓRICO DE EXAMES E DIAGNÓSTICOS:`;

      for (const exam of exams.slice(-5)) {
        context += `\n\n--- Exame: ${exam.type} ---`;
        context += `\nData: ${new Date(exam.date).toLocaleDateString("pt-BR")}`;
        context += `\nStatus: ${exam.status}`;

        if (exam.result) {
          context += `\nResultado/Diagnóstico Preliminar: ${exam.result.substring(0, 300)}...`;
        }

        if (exam.doctorNotes) {
          context += `\nNotas do Médico: ${exam.doctorNotes.substring(0, 300)}...`;
        }

        if (exam.finalExplanation) {
          context += `\nExplicação Final: ${exam.finalExplanation.substring(0, 200)}...`;
        }
      }
    }

    if (patient.wellnessPlan) {
      context += `\n\nPLANO DE BEM-ESTAR:`;
      if (patient.wellnessPlan.preliminaryAnalysis) {
        context += `\nAnálise Preliminar: ${patient.wellnessPlan.preliminaryAnalysis.substring(0, 200)}...`;
      }
      if (patient.wellnessPlan.exercisePlan) {
        context += `\nPlano de Exercícios: ${patient.wellnessPlan.exercisePlan.substring(0, 200)}...`;
      }
      if (patient.wellnessPlan.mentalWellnessPlan) {
        context += `\nPlano de Bem-Estar Mental: ${patient.wellnessPlan.mentalWellnessPlan.substring(0, 200)}...`;
      }
    }

    return context;
  } catch (error) {
    console.error("Erro ao buscar contexto do paciente:", error);
    return "Erro ao acessar dados do paciente.";
  }
}

async function getDoctorsContext(): Promise<string> {
  try {
    const doctors = await getDoctors();

    if (!doctors || doctors.length === 0) {
      return "Nenhum médico disponível no momento.";
    }

    let context = `\n\nMÉDICOS DISPONÍVEIS NA PLATAFORMA (${doctors.length} médicos):`;

    for (const doctor of doctors.slice(0, 10)) {
      context += `\n\n- Dr(a). ${doctor.name}`;
      context += `\n  Especialidade: ${doctor.specialty || 'Clínico Geral'}`;
      context += `\n  CRM: ${doctor.crm}`;
      context += `\n  Status: ${doctor.online ? '🟢 Online' : '⚪ Offline'}`;
      context += `\n  ID: ${doctor.id}`;
    }

    return context;
  } catch (error) {
    console.error("Erro ao buscar médicos:", error);
    return "Erro ao acessar lista de médicos.";
  }
}


const therapistPrompt = ai.definePrompt({
  name: "therapistChatPrompt",
  input: {
    schema: z.object({
      patientContext: z.string(),
      doctorsContext: z.string(),
      message: z.string(),
      conversationHistory: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          }),
        )
        .optional(),
    }),
  },
  output: { schema: TherapistChatOutputSchema },
  prompt: `Você é uma terapeuta de IA altamente empática e competente, especializada em saúde mental e bem-estar. 
Você também atua como assistente pessoal de saúde do paciente.

SUAS RESPONSABILIDADES:
1. Fornecer suporte emocional e terapêutico
2. Ajudar o paciente a entender seus diagnósticos e condições de saúde
3. Motivar o paciente a seguir seus planos de tratamento
4. Responder perguntas sobre exames, medicamentos e recomendações médicas
5. Oferecer técnicas de gerenciamento de estresse e ansiedade
6. Ser um ouvinte atento e compassivo
7. CONSULTAR E AGENDAR CONSULTAS com médicos da plataforma

CAPACIDADE DE AGENDAMENTO:
- Você tem acesso à lista de médicos cadastrados na plataforma
- Quando o paciente pedir para agendar consulta, use os dados dos médicos disponíveis
- Apresente os médicos por especialidade quando solicitado
- Informe se o médico está online ou offline
- Para agendar, peça confirmação: data, horário e médico escolhido
- Após confirmar, diga que a consulta foi agendada com sucesso

CONTEXTO DO PACIENTE:
{{{patientContext}}}

{{{doctorsContext}}}

{{#if conversationHistory}}
HISTÓRICO DA CONVERSA ATUAL:
{{#each conversationHistory}}
{{this.role}}: {{this.content}}
{{/each}}
{{/if}}

MENSAGEM ATUAL DO PACIENTE:
{{{message}}}

DIRETRIZES IMPORTANTES:
- SEMPRE responda em português brasileiro
- Seja empático, acolhedor e não julgue
- Use linguagem simples e clara
- Quando discutir diagnósticos, seja informativo mas encoraje o paciente a seguir as orientações médicas
- Ofereça apoio emocional genuíno
- Se o paciente mencionar sintomas graves ou pensamentos suicidas, incentive-o a procurar ajuda profissional imediatamente
- Use o contexto médico disponível para fornecer respostas personalizadas
- Seja positivo e motivador, mas realista
- Quando apropriado, lembre o paciente de seguir seus planos de bem-estar
- Nunca dê diagnósticos ou prescreva medicamentos - você pode apenas explicar o que já foi diagnosticado
- Quando o paciente quiser agendar consulta, apresente os médicos disponíveis e ajude no agendamento

Forneça sua resposta abaixo:`,
  model: "googleai/gemini-2.5-flash",
});

const therapistChatFlow = ai.defineFlow(
  {
    name: "therapistChatFlow",
    inputSchema: TherapistChatInputSchema,
    outputSchema: TherapistChatOutputSchema,
  },
  async (input) => {
    const patientContext = await getPatientContext(input.patientId);
    const doctorsContext = await getDoctorsContext();

    const { output } = await therapistPrompt({
      patientContext,
      doctorsContext,
      message: input.message,
      conversationHistory: input.conversationHistory,
    });

    const response = output!;

    trackChatMessage(
      input.patientId,
      input.message,
      response.response,
      'gemini-2.5-flash'
    ).catch(err => console.error('[Therapist Chat Flow] Usage tracking error:', err));

    return response;
  },
);
