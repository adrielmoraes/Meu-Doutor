import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { roomId, patientId, doctorId, type } = await request.json();

    if (!roomId || !patientId || !doctorId || !type) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    
    // Criar registro da chamada
    await db.collection('callRooms').doc(roomId).set({
      patientId,
      doctorId,
      type,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
    });

    return NextResponse.json({ success: true, roomId });
  } catch (error) {
    console.error('Erro ao criar chamada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}