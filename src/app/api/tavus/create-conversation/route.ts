import { NextRequest, NextResponse } from 'next/server';
import { saveTavusConversation } from '@/lib/db-adapter';

export async function POST(request: NextRequest) {
  try {
    const { patientId, patientName, conversationName } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID obrigatório' }, { status: 400 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    const replicaId = process.env.TAVUS_REPLICA_ID;
    const personaId = process.env.TAVUS_PERSONA_ID;

    if (!tavusApiKey || !replicaId || !personaId) {
      throw new Error('Variáveis de ambiente Tavus não configuradas');
    }

    const conversationPayload = {
      persona_id: personaId,
      replica_id: replicaId,
      conversation_name: conversationName || `Consulta - ${patientName}`,
      conversational_context: `Você é MediAI, uma assistente médica virtual especializada em fazer triagem inicial de pacientes.

PACIENTE: ${patientName}
ID: ${patientId}

INSTRUÇÕES:
- Cumprimente o paciente de forma calorosa e profissional
- Pergunte sobre os sintomas atuais e quando começaram
- Investigue a intensidade e frequência dos sintomas
- Pergunte sobre histórico médico relevante
- Seja empática e tranquilizadora
- Faça perguntas claras e diretas
- Ao final, resuma o que foi discutido
- Lembre o paciente que esta é uma avaliação preliminar

IMPORTANTE:
- Não faça diagnósticos definitivos
- Sempre sugira consulta com médico se necessário
- Seja clara sobre as limitações de uma consulta virtual
- Mantenha tom profissional mas acolhedor`,
      properties: {
        max_call_duration: 1800,
        participant_left_timeout: 60,
        enable_recording: true,
        language: 'Portuguese'
      },
      custom_greeting: `Olá ${patientName}, eu sou a MediAI, sua assistente virtual de saúde. Como posso ajudá-lo hoje?`
    };

    console.log('[Tavus] Criando conversa com payload:', conversationPayload);

    const response = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'x-api-key': tavusApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(conversationPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Tavus API Error:', error);
      throw new Error(`Falha ao criar conversa: ${error}`);
    }

    const data = await response.json();

    console.log('[Tavus] Conversa criada:', data);

    await saveTavusConversation({
      patientId,
      conversationId: data.conversation_id,
      startTime: new Date()
    });

    return NextResponse.json({
      success: true,
      conversationUrl: data.conversation_url,
      conversationId: data.conversation_id
    });

  } catch (error: any) {
    console.error('Erro ao criar conversa Tavus:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao criar conversa virtual',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';