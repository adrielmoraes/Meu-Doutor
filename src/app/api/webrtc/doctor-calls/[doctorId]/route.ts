import { NextRequest, NextResponse } from 'next/server';
import { getActiveCallsForDoctor, getPatientById } from '@/lib/db-adapter';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await context.params;

    const callRooms = await getActiveCallsForDoctor(doctorId);

    const calls = await Promise.all(
      callRooms.map(async (callRoom) => {
        const patient = await getPatientById(callRoom.patientId);
        const patientName = patient?.name || 'Paciente';

        return {
          id: callRoom.id,
          patientName,
          patientId: callRoom.patientId,
          roomId: callRoom.id,
          createdAt: callRoom.createdAt?.toISOString(),
          status: callRoom.status,
        };
      })
    );

    return NextResponse.json(calls);
  } catch (error) {
    console.error('Erro ao buscar chamadas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
