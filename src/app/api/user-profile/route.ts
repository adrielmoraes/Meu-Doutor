import { NextRequest, NextResponse } from 'next/server';
import { getPatientById, getDoctorById } from '@/lib/db-adapter';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    if (role === 'patient') {
      const patient = await getPatientById(userId);
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }

      return NextResponse.json({
        name: patient.name,
        email: patient.email,
        avatar: patient.avatar,
        avatarHint: patient.avatarHint,
      });
    } else if (role === 'doctor') {
      const doctor = await getDoctorById(userId);
      if (!doctor) {
        return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      }

      return NextResponse.json({
        name: doctor.name,
        email: doctor.email,
        avatar: doctor.avatar,
        avatarHint: doctor.avatarHint,
      });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
