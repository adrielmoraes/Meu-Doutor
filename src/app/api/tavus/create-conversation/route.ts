
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { patientId, conversationName } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID obrigatório' }, { status: 400 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY não configurada');
    }

    // Criar conversa na Tavus API
    const response = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'x-api-key': tavusApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replica_id: process.env.TAVUS_REPLICA_ID || 'default',
        conversation_name: conversationName,
        conversational_context: `Você é a MediAI, assistente médica virtual em português brasileiro. 
        
Seu papel é:
- Fornecer orientações preliminares de saúde
- Analisar sintomas do paciente (ID: ${patientId})
- Recomendar especialistas quando necessário
- Acessar histórico médico e exames do paciente
- Manter tom empático e profissional

IMPORTANTE: Você NÃO é médico. Sempre oriente consulta com profissional humano para diagnósticos definitivos.`,
        custom_greeting: 'Olá! Sou a MediAI, sua assistente de saúde. Como posso ajudar você hoje?',
        properties: {
          max_call_duration: 1800, // 30 minutos
          participant_left_timeout: 60,
          enable_recording: true,
          enable_transcription: true,
          language: 'pt-BR'
        }
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
