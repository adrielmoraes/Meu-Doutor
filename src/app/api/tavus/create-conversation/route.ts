import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../server/storage';
import { patients, exams, consultations } from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';

async function getPatientMedicalContext(patientId: string) {
  try {
    // Buscar dados do paciente
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, patientId)
    });

    if (!patient) {
      return null;
    }

    // Buscar exames do paciente
    const patientExams = await db.query.exams.findMany({
      where: eq(exams.patientId, patientId),
      orderBy: (exams, { desc }) => [desc(exams.createdAt)]
    });

    // Buscar consultas anteriores
    const patientConsultations = await db.query.consultations.findMany({
      where: eq(consultations.patientId, patientId),
      orderBy: (consultations, { desc }) => [desc(consultations.createdAt)],
      limit: 5 // Últimas 5 consultas
    });

    return {
      patient,
      exams: patientExams,
      consultations: patientConsultations
    };
  } catch (error) {
    console.error('Erro ao buscar contexto médico:', error);
    return null;
  }
}

function formatMedicalContext(data: any) {
  if (!data || !data.patient) {
    return 'Dados do paciente não disponíveis.';
  }

  const { patient, exams, consultations } = data;

  let context = `# CONTEXTO MÉDICO COMPLETO DO PACIENTE

## Informações do Paciente
- Nome: ${patient.name}
- Idade: ${patient.age} anos
- Gênero: ${patient.gender}
- Cidade: ${patient.city}, ${patient.state}
- Status Atual: ${patient.status}
${patient.reportedSymptoms ? `\n### Sintomas Reportados Anteriormente:\n${patient.reportedSymptoms}\n` : ''}
${patient.examResults ? `\n### Resultados de Exames Prévios:\n${patient.examResults}\n` : ''}
${patient.doctorNotes ? `\n### Observações Médicas:\n${patient.doctorNotes}\n` : ''}
`;

  // Adicionar exames
  if (exams && exams.length > 0) {
    context += `\n## EXAMES REALIZADOS (${exams.length} exame(s))\n`;
    exams.forEach((exam: any, index: number) => {
      context += `
### Exame ${index + 1}: ${exam.type}
- Data: ${exam.date}
- Status: ${exam.status}
- Resultado: ${exam.result}
- Diagnóstico Preliminar: ${exam.preliminaryDiagnosis}
- Explicação: ${exam.explanation}
- Sugestões: ${exam.suggestions}
${exam.results ? `- Valores Laboratoriais:\n${exam.results.map((r: any) => `  • ${r.name}: ${r.value} (Ref: ${r.reference})`).join('\n')}` : ''}
${exam.doctorNotes ? `- Observações do Médico: ${exam.doctorNotes}` : ''}
${exam.finalExplanation ? `- Explicação Final: ${exam.finalExplanation}` : ''}
`;
    });
  }

  // Adicionar consultas anteriores
  if (consultations && consultations.length > 0) {
    context += `\n## HISTÓRICO DE CONSULTAS (${consultations.length} consulta(s) recente(s))\n`;
    consultations.forEach((consult: any, index: number) => {
      context += `
### Consulta ${index + 1}
- Data: ${consult.date}
- Tipo: ${consult.type}
- Resumo: ${consult.summary}
${consult.transcription ? `- Transcrição: ${consult.transcription.substring(0, 300)}...` : ''}
`;
    });
  }

  // Adicionar plano de bem-estar se disponível
  if (patient.wellnessPlan) {
    const wp = patient.wellnessPlan;
    context += `\n## PLANO DE BEM-ESTAR ATUAL\n`;
    if (wp.dietaryPlan) context += `\n### Plano Alimentar:\n${wp.dietaryPlan}\n`;
    if (wp.exercisePlan) context += `\n### Plano de Exercícios:\n${wp.exercisePlan}\n`;
    if (wp.mentalWellnessPlan) context += `\n### Plano de Bem-Estar Mental:\n${wp.mentalWellnessPlan}\n`;
  }

  return context;
}

export async function POST(request: NextRequest) {
  try {
    const { patientId, conversationName } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID obrigatório' }, { status: 400 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    const personaId = process.env.PERSONA_ID;
    const replicaId = process.env.REPLICA_ID;

    // Configurações de timeout (com valores padrão)
    const maxCallDuration = parseInt(process.env.TAVUS_MAX_CALL_DURATION || '1800'); // 30 min padrão
    const participantLeftTimeout = parseInt(process.env.TAVUS_PARTICIPANT_LEFT_TIMEOUT || '60');
    const participantAbsentTimeout = parseInt(process.env.TAVUS_PARTICIPANT_ABSENT_TIMEOUT || '120');

    if (!tavusApiKey || !personaId || !replicaId) {
      console.error('Missing Tavus environment variables:', { hasApiKey: !!tavusApiKey, hasPersonaId: !!personaId, hasReplicaId: !!replicaId });
      throw new Error('TAVUS_API_KEY, PERSONA_ID ou REPLICA_ID não configuradas');
    }

    // 🔥 BUSCAR CONTEXTO MÉDICO COMPLETO DO PACIENTE
    console.log('[Tavus] Buscando contexto médico do paciente:', patientId);
    const medicalData = await getPatientMedicalContext(patientId);
    const medicalContext = formatMedicalContext(medicalData);
    console.log('[Tavus] Contexto médico carregado com sucesso');
    console.log('[Tavus] Total de exames:', medicalData?.exams?.length || 0);
    console.log('[Tavus] Total de consultas:', medicalData?.consultations?.length || 0);

    // Criar conversa usando o endpoint correto da Tavus CVI
    const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'x-api-key': tavusApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          replica_id: replicaId,
          persona_id: personaId,
          conversational_context: medicalContext,
          metadata: {
            patientId: patientId,
          },
          properties: {
            max_call_duration: maxCallDuration,
            participant_left_timeout: participantLeftTimeout,
            participant_absent_timeout: participantAbsentTimeout,
            enable_recording: true,
            enable_transcription: true
          },
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/tavus/webhook`
        })
      });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavus API Error:', errorText);

      // Parse error to provide specific messages
      let errorMessage = 'Falha ao criar conversa';
      try {
        const errorData = JSON.parse(errorText);

        // Check for specific error types
        if (errorData.message?.includes('out of conversational credits')) {
          errorMessage = 'Créditos Tavus esgotados. Por favor, adicione créditos na sua conta Tavus (tavusapi.com) para continuar usando a Consulta ao Vivo.';
        } else if (errorData.message?.includes('maximum concurrent conversations')) {
          errorMessage = 'Você já possui uma consulta ao vivo ativa. Por favor, encerre a consulta anterior antes de iniciar uma nova, ou aguarde alguns minutos e tente novamente.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        errorMessage = errorText;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    return NextResponse.json({
      conversationId: data.conversation_id,
      conversationUrl: data.conversation_url
    });

  } catch (error: any) {
    console.error('Erro ao criar conversa Tavus:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao criar conversa',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';