
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId é obrigatório' },
        { status: 400 }
      );
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY não configurada');
    }

    const response = await fetch(
      `https://tavusapi.com/v2/conversations/${conversationId}`,
      {
        headers: {
          'x-api-key': tavusApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Tavus API Error:', error);
      throw new Error(`Falha ao obter transcrição: ${error}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      transcript: data.transcript || '',
      status: data.status,
      duration: data.duration
    });

  } catch (error: any) {
    console.error('Erro ao obter transcrição:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao obter transcrição',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
