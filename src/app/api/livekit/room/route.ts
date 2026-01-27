import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { getSession } from '@/lib/session';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { roomName } = await request.json();

    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName é obrigatório' },
        { status: 400 }
      );
    }

    const expectedRoomName = `mediai-consultation-${session.userId}`;
    const isAdmin = session.role === 'admin';
    
    if (roomName !== expectedRoomName && !isAdmin) {
      console.warn(`[LiveKit Room] Unauthorized deletion attempt: ${roomName} by user ${session.userId}`);
      return NextResponse.json(
        { error: 'Não autorizado a deletar esta sala' },
        { status: 403 }
      );
    }

    const livekitUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !apiKey || !apiSecret) {
      console.error('[LiveKit Room] Credenciais não configuradas');
      return NextResponse.json(
        { error: 'Serviço indisponível' },
        { status: 500 }
      );
    }

    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    try {
      const rooms = await roomService.listRooms([roomName]);
      
      if (rooms && rooms.length > 0) {
        console.log(`[LiveKit Room] Deletando sala: ${roomName}`);
        
        const participants = await roomService.listParticipants(roomName);
        for (const participant of participants) {
          try {
            await roomService.removeParticipant(roomName, participant.identity);
            console.log(`[LiveKit Room] Participante removido: ${participant.identity}`);
          } catch (e) {
            console.log(`[LiveKit Room] Erro ao remover participante: ${participant.identity}`);
          }
        }
        
        await roomService.deleteRoom(roomName);
        console.log(`[LiveKit Room] Sala deletada com sucesso: ${roomName}`);
      } else {
        console.log(`[LiveKit Room] Sala não encontrada: ${roomName}`);
      }

      return NextResponse.json({ success: true });
    } catch (error: any) {
      if (error.message?.includes('not found') || error.code === 'NOT_FOUND') {
        console.log(`[LiveKit Room] Sala já não existe: ${roomName}`);
        return NextResponse.json({ success: true });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('[LiveKit Room] Erro ao deletar sala:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar sala' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
