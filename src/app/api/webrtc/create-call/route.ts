import { NextRequest, NextResponse } from 'next/server';
import { createCallRoom } from '@/lib/db-adapter';

export async function POST(request: NextRequest) {
  try {
    const { roomId, patientId, doctorId, type } = await request.json();

    if (!roomId || !patientId || !doctorId || !type) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando' },
        { status: 400 }
      );
    }

    await createCallRoom(roomId, patientId, doctorId, type);

    return NextResponse.json({ success: true, roomId });
  } catch (error) {
    console.error('Erro ao criar chamada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}