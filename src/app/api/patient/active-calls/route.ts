import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '../../../../../server/storage';
import { callRooms, doctors } from '../../../../../shared/schema';
import { eq, and, or, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'patient') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const patientId = session.userId;

    // Find active calls (waiting or active) for this patient - order by newest first
    const activeCalls = await db
      .select({
        roomId: callRooms.id,
        doctorId: callRooms.doctorId,
        status: callRooms.status,
        createdAt: callRooms.createdAt,
        doctorName: doctors.name,
        doctorSpecialty: doctors.specialty,
        doctorAvatar: doctors.avatar,
      })
      .from(callRooms)
      .leftJoin(doctors, eq(callRooms.doctorId, doctors.id))
      .where(
        and(
          eq(callRooms.patientId, patientId),
          or(
            eq(callRooms.status, 'waiting'),
            eq(callRooms.status, 'active')
          )
        )
      )
      .orderBy(desc(callRooms.createdAt));

    // Filter out calls older than 5 minutes (stale calls)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCalls = activeCalls.filter(call => {
      const callTime = new Date(call.createdAt);
      return callTime > fiveMinutesAgo;
    });

    return NextResponse.json({ 
      calls: recentCalls,
      hasActiveCall: recentCalls.length > 0
    });
  } catch (error) {
    console.error('Erro ao buscar chamadas ativas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
