
import { NextRequest, NextResponse } from 'next/server';
import { updateTavusConversation } from '@/lib/firestore-admin-adapter';
import { analyzeTavusConversation } from '@/ai/flows/analyze-tavus-conversation';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, patientId } = await request.json();

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

    // Buscar transcrição completa
    const transcriptResponse = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
      headers: {
        'x-api-key': tavusApiKey
      }
    });

    let transcript = '';
    let analysis = null;

    if (transcriptResponse.ok) {
      const data = await transcriptResponse.json();
      transcript = data.transcript || '';

      // Realizar análise pós-consulta com IA
      if (transcript && patientId) {
        try {
          analysis = await analyzeTavusConversation({
            transcript,
            patientId
          });

          console.log('[End Conversation] Análise concluída:', analysis);

          // Atualizar conversa no banco com transcrição e análise
          await updateTavusConversation(conversationId, {
            transcript,
            summary: analysis.summary,
          });
        } catch (analysisError) {
          console.error('[End Conversation] Erro na análise:', analysisError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      transcript,
      analysis
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
