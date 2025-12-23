import { NextRequest } from 'next/server';
import { getSignalsForRoom } from '@/lib/db-adapter';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string; userId: string }> }
) {
  const { roomId, userId } = await context.params;

  const stream = new ReadableStream({
    async start(controller) {
      const seenSignalIds = new Set<number>();
      
      const pollForSignals = async () => {
        try {
          const signals = await getSignalsForRoom(roomId, userId);
          
          for (const signal of signals) {
            if (!seenSignalIds.has(signal.id)) {
              seenSignalIds.add(signal.id);
              
              const signalData = {
                from: signal.from,
                data: signal.data,
              };
              
              controller.enqueue(
                `data: ${JSON.stringify(signalData)}\n\n`
              );
            }
          }
        } catch (error) {
          console.error('Erro ao buscar sinais:', error);
        }
      };

      const intervalId = setInterval(pollForSignals, 1000);

      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
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
