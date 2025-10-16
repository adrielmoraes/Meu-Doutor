
import { NextRequest, NextResponse } from 'next/server';

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
        conversation_name: conversationName,
        conversational_context: `Você é a MediAI, assistente médica virtual em português brasileiro.

Seu papel é:
- Fornecer orientações preliminares de saúde
- Analisar sintomas do paciente (ID: ${patientId})
- Recomendar especialistas quando necessário
- Manter tom empático e profissional

IMPORTANTE: Você NÃO é médico. Sempre oriente consulta com profissional para diagnósticos definitivos.`,
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
      const error = await response.text();
      console.error('Tavus API Error:', error);
      throw new Error(`Falha ao criar conversa: ${error}`);
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
