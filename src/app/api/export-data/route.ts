import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPatientById, getExamsByPatientId } from '@/lib/db-adapter';
import { exportPatientDataJSON, generatePatientDataHTML } from '@/lib/export-data';

/**
 * API endpoint para exportar dados do paciente (LGPD compliance)
 * Suporta formatos: JSON e HTML (para conversão em PDF)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'patient') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    // Buscar dados do paciente
    const patient = await getPatientById(session.userId);
    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Buscar exames do paciente
    const exams = await getExamsByPatientId(session.userId);

    if (format === 'json') {
      const jsonData = exportPatientDataJSON(patient, exams);
      
      return new NextResponse(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="mediai-dados-${patient.name.replace(/\s+/g, '-')}-${Date.now()}.json"`,
        },
      });
    }

    if (format === 'html') {
      const htmlData = generatePatientDataHTML(patient, exams);
      
      return new NextResponse(htmlData, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="mediai-dados-${patient.name.replace(/\s+/g, '-')}-${Date.now()}.html"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Formato inválido. Use "json" ou "html"' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Export Data] Erro ao exportar dados:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar dados' },
      { status: 500 }
    );
  }
}
