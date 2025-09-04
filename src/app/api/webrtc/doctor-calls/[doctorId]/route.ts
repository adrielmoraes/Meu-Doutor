import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    const { doctorId } = params;
    const db = getAdminDb();

    // Buscar chamadas ativas para este médico
    const callsSnapshot = await db
      .collection('callRooms')
      .where('doctorId', '==', doctorId)
      .where('status', 'in', ['waiting', 'active'])
      .orderBy('createdAt', 'desc')
      .get();

    const calls = await Promise.all(
      callsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Buscar nome do paciente
        const patientDoc = await db.collection('patients').doc(data.patientId).get();
        const patientName = patientDoc.exists ? patientDoc.data()?.name : 'Paciente';

        return {
          id: doc.id,
          patientName,
          patientId: data.patientId,
          roomId: doc.id,
          createdAt: data.createdAt,
          status: data.status,
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