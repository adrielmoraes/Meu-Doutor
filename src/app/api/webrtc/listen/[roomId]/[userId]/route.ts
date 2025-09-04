import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string; userId: string } }
) {
  const { roomId, userId } = params;

  const stream = new ReadableStream({
    start(controller) {
      const db = getAdminDb();
      const signalsRef = db
        .collection('callRooms')
        .doc(roomId)
        .collection('signals');

      // Configurar listener para novos sinais
      const unsubscribe = signalsRef
        .where('to', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const signalData = {
                from: data.from,
                data: data.data,
              };
              
              controller.enqueue(
                `data: ${JSON.stringify(signalData)}\n\n`
              );
            }
          });
        });

      // Limpar listener quando a conexão é fechada
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}