import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../server/storage';
import { appointments, consultations } from '../../../../shared/schema';
import { eq, and, count, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    const totalPatientsResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${appointments.patientId})` })
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId));

    const upcomingAppointmentsResult = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.status, 'Agendada')
        )
      );

    const completedConsultationsResult = await db
      .select({ count: count() })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId));

    return NextResponse.json({
      totalPatients: Number(totalPatientsResult[0]?.count) || 0,
      upcomingAppointments: Number(upcomingAppointmentsResult[0]?.count) || 0,
      completedConsultations: Number(completedConsultationsResult[0]?.count) || 0
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    return NextResponse.json({ error: 'Failed to fetch doctor stats' }, { status: 500 });
  }
}
