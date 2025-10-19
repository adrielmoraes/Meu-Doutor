
import { NextRequest, NextResponse } from 'next/server';
import { saveTavusConversation, updateTavusConversation } from '@/lib/firestore-admin-adapter';

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    console.log('[Tavus Webhook] Evento recebido:', event);

    // Processar diferentes tipos de eventos
    switch (event.event_type) {
      case 'conversation.started':
        console.log('[Tavus] Conversa iniciada:', event.conversation_id);
        
        // Salvar início da conversa
        if (event.metadata?.patientId) {
          await saveTavusConversation({
            patientId: event.metadata.patientId,
            conversationId: event.conversation_id,
            transcript: '',
            startTime: new Date().toISOString(),
          });
        }
        break;
      
      case 'conversation.ended':
        console.log('[Tavus] Conversa encerrada:', event.conversation_id);
        
        // Atualizar conversa com tempo final e duração
        await updateTavusConversation(event.conversation_id, {
          endTime: new Date().toISOString(),
          duration: event.duration || 0,
        });
        break;
      
      case 'transcript.update':
        console.log('[Tavus] Transcrição atualizada:', event.transcript);
        
        // Atualizar transcrição em tempo real
        if (event.transcript) {
          await updateTavusConversation(event.conversation_id, {
            transcript: event.transcript,
          });
        }
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
