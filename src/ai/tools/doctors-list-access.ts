'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAdminDb } from '@/lib/firebase-admin';

export const doctorsListAccessTool = ai.defineTool(
  {
    name: 'doctorsListAccessTool',
    description: 'Acessa a lista completa de médicos cadastrados no sistema MediAI. Use esta ferramenta quando o paciente perguntar sobre disponibilidade de médicos, especialidades disponíveis, ou quando precisar recomendar um médico específico.',
    inputSchema: z.object({
      specialty: z.string().optional().describe('Filtro opcional por especialidade médica (ex: "Cardiologia", "Neurologia", "Clínico Geral"). Se não especificado, retorna todos os médicos.'),
      limit: z.number().optional().describe('Número máximo de médicos a retornar. Padrão é 10.'),
    }),
    outputSchema: z.string().describe('Lista formatada de médicos disponíveis com suas especialidades, experiência e disponibilidade.'),
  },
  async (input) => {
    try {
      const adminDb = getAdminDb();
      let query = adminDb.collection('doctors');

      if (input.specialty) {
        query = query.where('specialty', '==', input.specialty);
      }

      const limit = input.limit || 10;
      const snapshot = await query.limit(limit).get();

      if (snapshot.empty) {
        if (input.specialty) {
          return `Não encontramos médicos cadastrados com a especialidade "${input.specialty}" no momento. Temos médicos de outras especialidades disponíveis. Posso buscar para você?`;
        }
        return 'No momento não há médicos cadastrados no sistema.';
      }

      let response = `Médicos Disponíveis no Sistema MediAI (${snapshot.size} encontrado(s)):\n\n`;

      snapshot.forEach((doc, index) => {
        const doctor = doc.data();
        
        response += `👨‍⚕️ Dr(a). ${doctor.name || 'Nome não informado'}\n`;
        response += `📋 Especialidade: ${doctor.specialty || 'Não especificada'}\n`;
        
        if (doctor.crm) {
          response += `🆔 CRM: ${doctor.crm}\n`;
        }
        
        if (doctor.bio) {
          const shortBio = doctor.bio.substring(0, 150);
          response += `📝 Sobre: ${shortBio}${doctor.bio.length > 150 ? '...' : ''}\n`;
        }
        
        if (doctor.experience) {
          response += `⭐ Experiência: ${doctor.experience} anos\n`;
        }

        if (doctor.level !== undefined) {
          response += `🎖️ Nível no Sistema: ${doctor.level}\n`;
        }
        
        response += '\n' + '─'.repeat(50) + '\n\n';
      });

      response += '\n💡 Dica: O paciente pode agendar uma consulta com qualquer um desses médicos através do sistema.';

      return response;

    } catch (error) {
      console.error('[Doctors List Access Tool] Error:', error);
      return 'Desculpe, não consegui acessar a lista de médicos no momento. Por favor, tente novamente em alguns instantes.';
    }
  }
);
