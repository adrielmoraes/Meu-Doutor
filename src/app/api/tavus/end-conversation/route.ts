
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID obrigatório' }, { status: 400 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY não configurada');
    }

    // Encerrar conversa na Tavus API
    const response = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
      method: 'POST',
      headers: {
        'x-api-key': tavusApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Tavus API Error:', error);
      throw new Error(`Falha ao encerrar conversa: ${error}`);
    }

    // Buscar transcrição e resumo
    const transcriptResponse = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
      headers: {
        'x-api-key': tavusApiKey
      }
    });

    let transcript = '';
    if (transcriptResponse.ok) {
      const data = await transcriptResponse.json();
      transcript = data.transcript || '';
    }

    return NextResponse.json({
      success: true,
      transcript
    });

  } catch (error: any) {
    console.error('Erro ao encerrar conversa Tavus:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao encerrar conversa',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
