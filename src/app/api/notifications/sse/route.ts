import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { createSSEStream } from '@/lib/notifications-sse';

/**
 * API endpoint para Server-Sent Events (SSE)
 * Permite notificações em tempo real para usuários
 */
export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session || !session.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const stream = createSSEStream(session.userId);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
