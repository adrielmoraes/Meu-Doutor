import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateCallRoomStatus } from '@/lib/db-adapter';
import { db } from '../../../../../server/storage';
import { callRooms } from '../../../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'patient') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: 'roomId é obrigatório' }, { status: 400 });
    }

    // Verify that this call room belongs to this patient
    const room = await db
      .select()
      .from(callRooms)
      .where(
        and(
          eq(callRooms.id, roomId),
          eq(callRooms.patientId, session.userId)
        )
      )
      .limit(1);

    if (!room.length) {
      return NextResponse.json({ error: 'Chamada não encontrada ou não autorizada' }, { status: 403 });
    }

    // Mark the call as active
    await updateCallRoomStatus(roomId, 'active');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao entrar na chamada:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
