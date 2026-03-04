"use server";

/**
 * @fileOverview AI flow for therapist chat with comprehensive patient data access
 *
 * This flow implements an AI therapist that has access to:
 * - Patient medical history
 * - All exam results and diagnoses
 * - Wellness plans
 * - Persistent conversation history (last 20 interactions)
 * - Doctor search and appointment scheduling via Genkit Tool
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { getPatientById, getExamsByPatientId, getDoctors, createAppointment } from "@/lib/db-adapter";
import { trackChatMessage } from "@/lib/usage-tracker";

// ─── Schemas ────────────────────────────────────────────────────────────────

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

// ─── Genkit Tool: Agendar Consulta ──────────────────────────────────────────

const scheduleAppointmentTool = ai.defineTool(
  {
    name: "scheduleAppointment",
    description:
      "Agenda uma consulta médica real para o paciente com um médico da plataforma. Use esta ferramenta SOMENTE quando o paciente confirmar que deseja agendar. Você DEVE ter o ID do médico, a data (formato DD/MM/AAAA) e o horário (formato HH:mm).",
    inputSchema: z.object({
      patientId: z.string().describe("O ID do paciente que deseja agendar"),
      patientName: z.string().describe("O nome completo do paciente"),
      doctorId: z.string().describe("O ID do médico escolhido pelo paciente"),
      date: z.string().describe("A data da consulta no formato DD/MM/AAAA"),
      time: z.string().describe("O horário da consulta no formato HH:mm"),
      type: z.string().optional().describe("O tipo de consulta (ex: Avaliação, Retorno, Urgência). Padrão: Avaliação"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      appointmentId: z.string().optional(),
    }),
  },
  async (input) => {
    try {
      const appointmentId = await createAppointment({
        patientId: input.patientId,
        patientName: input.patientName,
        doctorId: input.doctorId,
        date: input.date,
        time: input.time,
        type: input.type || "Avaliação",
        status: "Agendada",
      } as any);

      return {
        success: true,
        message: `Consulta agendada com sucesso! ID: ${appointmentId}. Data: ${input.date} às ${input.time}.`,
        appointmentId,
      };
    } catch (error: any) {
      console.error("[ScheduleAppointmentTool] Erro:", error);
      return {
        success: false,
        message: `Erro ao agendar consulta: ${error.message || "erro desconhecido"}`,
      };
    }
  },
);

// ─── Context Builders ───────────────────────────────────────────────────────

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

    // IMC data
    if (patient.weight && patient.height) {
      const w = parseFloat(patient.weight.replace(',', '.'));
      const h = parseFloat(patient.height.replace(',', '.'));
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        const imc = w / ((h / 100) ** 2);
        const imcLabel = imc < 18.5 ? 'Abaixo do Peso' : imc < 25 ? 'Peso Normal' : imc < 30 ? 'Sobrepeso' : imc < 35 ? 'Obesidade Grau I' : imc < 40 ? 'Obesidade Grau II' : 'Obesidade Grau III (Mórbida)';
        context += `\nDados Antropométricos: Peso ${patient.weight}kg | Altura ${patient.height}cm | IMC: ${imc.toFixed(1)} (${imcLabel})`;
      }
    }

    if (patient.reportedSymptoms) {
      context += `\nQueixas/Sintomas Atuais: ${patient.reportedSymptoms}`;
    }

    // Persistent conversation history (parsed from JSON stored in DB)
    if (patient.conversationHistory) {
      try {
        const savedHistory = JSON.parse(patient.conversationHistory);
        if (Array.isArray(savedHistory) && savedHistory.length > 0) {
          const recentHistory = savedHistory.slice(-10); // Last 10 for context summary
          context += `\n\nRESUMO DAS ÚLTIMAS CONVERSAS COM O TERAPEUTA:`;
          for (const msg of recentHistory) {
            const roleLabel = msg.role === 'user' ? 'Paciente' : 'Terapeuta IA';
            // Truncate long messages in context
            const truncated = msg.content.length > 150 ? msg.content.substring(0, 150) + '...' : msg.content;
            context += `\n${roleLabel}: ${truncated}`;
          }
        }
      } catch {
        // Legacy format (plain text), use as-is but truncated
        if (patient.conversationHistory.length > 500) {
          context += `\n\nHistórico de Conversas Anteriores (legado):\n${patient.conversationHistory.substring(0, 500)}...`;
        } else {
          context += `\n\nHistórico de Conversas Anteriores:\n${patient.conversationHistory}`;
        }
      }
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
      if ((patient.wellnessPlan as any).preliminaryAnalysis) {
        context += `\nAnálise Preliminar: ${(patient.wellnessPlan as any).preliminaryAnalysis.substring(0, 200)}...`;
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

// ─── Prompt ─────────────────────────────────────────────────────────────────

const therapistPrompt = ai.definePrompt({
  name: "therapistChatPrompt",
  input: {
    schema: z.object({
      patientContext: z.string(),
      doctorsContext: z.string(),
      message: z.string(),
      patientId: z.string(),
      patientName: z.string(),
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
  tools: [scheduleAppointmentTool],
  prompt: `Você é uma terapeuta de IA altamente empática e competente, especializada em saúde mental e bem-estar. 
Você também atua como assistente pessoal de saúde do paciente.

SUAS RESPONSABILIDADES:
1. Fornecer suporte emocional e terapêutico
2. Ajudar o paciente a entender seus diagnósticos e condições de saúde
3. Motivar o paciente a seguir seus planos de tratamento
4. Responder perguntas sobre exames, medicamentos e recomendações médicas
5. Oferecer técnicas de gerenciamento de estresse e ansiedade
6. Ser um ouvinte atento e compassivo
7. CONSULTAR E AGENDAR CONSULTAS com médicos da plataforma usando a ferramenta scheduleAppointment

MEMÓRIA E CONTEXTO:
- Você TEM memória das conversas anteriores com este paciente
- O histórico abaixo contém as últimas interações — use-o para manter continuidade
- NUNCA diga "não lembro" ou "não tenho acesso" — consulte o histórico
- Faça referências a conversas anteriores naturalmente, como um terapeuta real faria

CAPACIDADE DE AGENDAMENTO:
- Você tem acesso à lista de médicos cadastrados na plataforma
- Quando o paciente pedir para agendar consulta, use os dados dos médicos disponíveis
- Apresente os médicos por especialidade quando solicitado
- Informe se o médico está online ou offline
- Para agendar, pergunte ao paciente: qual médico, data e horário desejados
- Após confirmar com o paciente, USE A FERRAMENTA scheduleAppointment passando:
  - patientId: "{{{patientId}}}"
  - patientName: "{{{patientName}}}"
  - doctorId: o ID do médico escolhido
  - date: a data no formato DD/MM/AAAA
  - time: o horário no formato HH:mm
- Confirme ao paciente que a consulta foi agendada com sucesso

CONTEXTO DO PACIENTE:
{{{patientContext}}}

{{{doctorsContext}}}

{{#if conversationHistory}}
HISTÓRICO DA CONVERSA (sessão atual + sessões anteriores):
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
- Quando o paciente quiser agendar consulta, apresente os médicos disponíveis e AGENDE usando a ferramenta
- Faça referência a conversas anteriores quando relevante para demonstrar continuidade terapêutica

Forneça sua resposta abaixo:`,
  model: "googleai/gemini-2.5-flash",
});

// ─── Flow ───────────────────────────────────────────────────────────────────

const therapistChatFlow = ai.defineFlow(
  {
    name: "therapistChatFlow",
    inputSchema: TherapistChatInputSchema,
    outputSchema: TherapistChatOutputSchema,
  },
  async (input) => {
    const patientContext = await getPatientContext(input.patientId);
    const doctorsContext = await getDoctorsContext();

    // Get patient name for the tool
    const patient = await getPatientById(input.patientId);
    const patientName = patient?.name || 'Paciente';

    const { output } = await therapistPrompt({
      patientContext,
      doctorsContext,
      message: input.message,
      patientId: input.patientId,
      patientName,
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

export async function therapistChat(
  input: TherapistChatInput,
): Promise<TherapistChatOutput> {
  return therapistChatFlow(input);
}
