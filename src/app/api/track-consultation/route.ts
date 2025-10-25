import { NextRequest, NextResponse } from 'next/server';
import { trackUsage } from '@/lib/db-adapter';

/**
 * API endpoint para registrar uso de consultas
 * Chamado pelo frontend quando inicia/termina uma consulta com IA
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, consultationType, durationSeconds } = body;

    if (!patientId || !consultationType) {
      return NextResponse.json(
        { error: 'patientId e consultationType são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo de consulta
    if (!['ai', 'doctor'].includes(consultationType)) {
      return NextResponse.json(
        { error: 'consultationType deve ser "ai" ou "doctor"' },
        { status: 400 }
      );
    }

    // Registrar uso
    await trackUsage({
      patientId,
      usageType: consultationType === 'ai' ? 'ai_call' : 'doctor_call',
      resourceName: consultationType === 'ai' ? 'AI Consultation (LiveKit)' : 'Doctor Consultation',
      durationSeconds: durationSeconds || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Consulta registrada com sucesso',
    });

  } catch (error: any) {
    console.error('[Usage Tracking] Erro ao registrar consulta:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
