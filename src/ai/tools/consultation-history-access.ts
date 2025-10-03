'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getConsultationsByPatient } from '@/lib/db-adapter';

export const consultationHistoryAccessTool = ai.defineTool(
  {
    name: 'consultationHistoryAccessTool',
    description: 'Use esta ferramenta para acessar o histórico completo de consultas médicas gravadas de um paciente, incluindo transcrições e resumos de consultas anteriores por vídeo chamada. Útil para obter contexto sobre consultas prévias, diagnósticos anteriores e evolução do quadro clínico.',
    inputSchema: z.object({
      patientId: z.string().describe('O identificador único do paciente.'),
      limit: z.number().optional().describe('Número máximo de consultas a retornar (padrão: 5)'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    if (!input.patientId) {
      return "Erro: ID do paciente é necessário para acessar histórico de consultas.";
    }

    console.log(`[Consultation History Tool] Buscando histórico para paciente: ${input.patientId}`);

    try {
      const limit = input.limit || 5;
      const allConsultations = await getConsultationsByPatient(input.patientId);
      const consultationsList = allConsultations.slice(0, limit);

      if (consultationsList.length === 0) {
        return `Nenhuma consulta gravada encontrada para o paciente com ID: ${input.patientId}`;
      }

      let response = `Histórico de Consultas do Paciente (${consultationsList.length} consulta(s) recente(s)):\n\n`;

      consultationsList.forEach((consultation, index) => {
        const consultDate = new Date(consultation.date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        response += `📅 Consulta ${index + 1} - ${consultDate}\n`;
        response += `Tipo: ${consultation.type === 'video-call' ? 'Vídeo Chamada' : 'Chat'}\n`;
        
        if (consultation.summary) {
          response += `\n📋 Resumo:\n${consultation.summary}\n`;
        }
        
        if (consultation.transcription && consultation.transcription.length > 0) {
          const shortTranscription = consultation.transcription.substring(0, 300);
          response += `\n💬 Trecho da transcrição:\n${shortTranscription}${consultation.transcription.length > 300 ? '...' : ''}\n`;
        }
        
        response += '\n' + '─'.repeat(50) + '\n\n';
        index++;
      });

      return response;

    } catch (error) {
      console.error('[Consultation History Tool] Erro ao buscar histórico:', error);
      return "Ocorreu um erro ao tentar recuperar o histórico de consultas do paciente.";
    }
  }
);
