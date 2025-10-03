import { NextRequest, NextResponse } from 'next/server';
import { updateCallRoomStatus } from '@/lib/db-adapter';

export async function POST(request: NextRequest) {
  try {
    const { roomId, status } = await request.json();

    if (!roomId || !status) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando' },
        { status: 400 }
      );
    }

    await updateCallRoomStatus(roomId, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status da chamada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}