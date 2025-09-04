import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { roomId, status } = await request.json();

    if (!roomId || !status) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    // Adicionar timestamps específicos
    if (status === 'active') {
      updateData.startedAt = new Date().toISOString();
    } else if (status === 'ended') {
      updateData.endedAt = new Date().toISOString();
    }

    await db
      .collection('callRooms')
      .doc(roomId)
      .update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status da chamada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}