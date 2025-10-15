
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    console.log('[Tavus Webhook] Evento recebido:', event);

    // Processar diferentes tipos de eventos
    switch (event.event_type) {
      case 'conversation.started':
        console.log('[Tavus] Conversa iniciada:', event.conversation_id);
        break;
      
      case 'conversation.ended':
        console.log('[Tavus] Conversa encerrada:', event.conversation_id);
        // Aqui você pode salvar a transcrição no banco de dados
        break;
      
      case 'transcript.update':
        console.log('[Tavus] Transcrição:', event.transcript);
        break;
      
      default:
        console.log('[Tavus] Evento desconhecido:', event.event_type);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro no webhook Tavus:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: error.message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
