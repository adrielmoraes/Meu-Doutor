
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { patientId, conversationName } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID obrigatório' }, { status: 400 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    const personaId = process.env.TAVUS_PERSONA_ID;

    if (!tavusApiKey || !personaId) {
      throw new Error('TAVUS_API_KEY ou TAVUS_PERSONA_ID não configuradas');
    }

    // Criar conversa usando o endpoint correto da Tavus CVI
    const response = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'x-api-key': tavusApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
          max_call_duration: 1800,
          participant_left_timeout: 60,
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
