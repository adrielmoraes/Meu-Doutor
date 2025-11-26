import { NextRequest, NextResponse } from 'next/server';
import { getDoctorById } from '@/lib/db-adapter';

export async function GET(
  request: NextRequest,
  context: { params: { doctorId: string } }
) {
  try {
    const doctorId = context.params.doctorId;

    if (!doctorId) {
      return NextResponse.json({ error: 'doctorId é obrigatório' }, { status: 400 });
    }

    const doctor = await getDoctorById(doctorId);

    if (!doctor) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      avatar: doctor.avatar,
      crm: doctor.crm,
    });
  } catch (error) {
    console.error('Erro ao buscar médico:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
