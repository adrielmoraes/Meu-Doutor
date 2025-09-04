import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { roomId, from, to, signal } = await request.json();

    if (!roomId || !from || !to || !signal) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    
    // Armazenar o sinal no Firebase
    await db
      .collection('callRooms')
      .doc(roomId)
      .collection('signals')
      .add({
        from,
        to,
        type: signal.type,
        data: signal,
        timestamp: new Date().toISOString(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar sinalização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}