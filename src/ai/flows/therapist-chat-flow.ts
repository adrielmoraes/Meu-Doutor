'use server';

/**
 * @fileOverview AI flow for therapist chat with comprehensive patient data access
 * 
 * This flow implements an AI therapist that has access to:
 * - Patient medical history
 * - All exam results and diagnoses
 * - Wellness plans
 * - Conversation history
 * 
 * It acts as both a therapist and personal health assistant
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getPatientById, getExamsByPatientId } from '@/lib/db-adapter';

const TherapistChatInputSchema = z.object({
  patientId: z.string().describe('The unique identifier for the patient'),
  message: z.string().describe('The patient message or question'),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional().describe('Previous messages in the conversation'),
});

export type TherapistChatInput = z.infer<typeof TherapistChatInputSchema>;

const TherapistChatOutputSchema = z.object({
  response: z.string().describe('The therapist AI empathetic and helpful response'),
});

export type TherapistChatOutput = z.infer<typeof TherapistChatOutputSchema>;

export async function therapistChat(input: TherapistChatInput): Promise<TherapistChatOutput> {
  return therapistChatFlow(input);
}

async function getPatientContext(patientId: string): Promise<string> {
  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
      return 'Paciente não encontrado.';
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
        context += `\nData: ${new Date(exam.date).toLocaleDateString('pt-BR')}`;
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
      if (patient.wellnessPlan.dietaryPlan) {
        context += `\nPlano Alimentar: ${patient.wellnessPlan.dietaryPlan.substring(0, 200)}...`;
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
    console.error('Erro ao buscar contexto do paciente:', error);
    return 'Erro ao acessar dados do paciente.';
  }
}

const therapistPrompt = ai.definePrompt({
  name: 'therapistChatPrompt',
  input: { 
    schema: z.object({
      patientContext: z.string(),
      message: z.string(),
      conversationHistory: z.array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })
      ).optional(),
    })
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

CONTEXTO DO PACIENTE:
{{{patientContext}}}

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

Forneça sua resposta abaixo:`,
});

const therapistChatFlow = ai.defineFlow(
  {
    name: 'therapistChatFlow',
    inputSchema: TherapistChatInputSchema,
    outputSchema: TherapistChatOutputSchema,
  },
  async (input) => {
    const patientContext = await getPatientContext(input.patientId);
    
    const { output } = await therapistPrompt({
      patientContext,
      message: input.message,
      conversationHistory: input.conversationHistory,
    });

    return output!;
  }
);
