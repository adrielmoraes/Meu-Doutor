import { NextRequest, NextResponse } from 'next/server';
import { getAllExamsForWellnessPlan } from '@/lib/db-adapter';
import { db } from '../../../../server/storage';
import { appointments } from '../../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 });
    }

    const exams = await getAllExamsForWellnessPlan(patientId);
    const examCount = exams.length;

    const upcomingAppointmentsData = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, patientId),
          eq(appointments.status, 'Agendada')
        )
      );

    return NextResponse.json({
      examCount,
      upcomingAppointments: upcomingAppointmentsData.length,
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
