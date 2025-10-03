'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDoctors, getDoctorsBySpecialty } from '@/lib/db-adapter';

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
      const limit = input.limit || 10;
      let doctorsList;

      if (input.specialty) {
        doctorsList = await getDoctorsBySpecialty(input.specialty, limit);
      } else {
        const allDoctors = await getDoctors();
        doctorsList = allDoctors.slice(0, limit);
      }

      if (doctorsList.length === 0) {
        if (input.specialty) {
          return `Não encontramos médicos cadastrados com a especialidade "${input.specialty}" no momento. Temos médicos de outras especialidades disponíveis. Posso buscar para você?`;
        }
        return 'No momento não há médicos cadastrados no sistema.';
      }

      let response = `Médicos Disponíveis no Sistema MediAI (${doctorsList.length} encontrado(s)):\n\n`;

      doctorsList.forEach((doctor, index) => {
        
        response += `👨‍⚕️ Dr(a). ${doctor.name || 'Nome não informado'}\n`;
        response += `📋 Especialidade: ${doctor.specialty || 'Não especificada'}\n`;
        
        if ((doctor as any).crm) {
          response += `🆔 CRM: ${(doctor as any).crm}\n`;
        }
        
        if ((doctor as any).bio) {
          const shortBio = (doctor as any).bio.substring(0, 150);
          response += `📝 Sobre: ${shortBio}${(doctor as any).bio.length > 150 ? '...' : ''}\n`;
        }
        
        if ((doctor as any).experience) {
          response += `⭐ Experiência: ${(doctor as any).experience} anos\n`;
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
