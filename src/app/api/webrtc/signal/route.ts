import { NextRequest, NextResponse } from 'next/server';
import { addSignal } from '@/lib/db-adapter';

export async function POST(request: NextRequest) {
  try {
    const { roomId, from, to, signal } = await request.json();

    if (!roomId || !from || !to || !signal) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando' },
        { status: 400 }
      );
    }

    await addSignal(roomId, from, to, signal.type, signal);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar sinalização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}