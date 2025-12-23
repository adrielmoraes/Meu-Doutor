import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPatientById, updatePatientWellnessPlan } from '@/lib/db-adapter';
import { saveFileBuffer } from '@/lib/file-storage';

type AudioSection = 'dietary' | 'exercise' | 'mental';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'patient') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { section, audioDataUri } = body as { section: AudioSection; audioDataUri: string };

    if (!section || !audioDataUri) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    if (!['dietary', 'exercise', 'mental'].includes(section)) {
      return NextResponse.json({ error: 'Seção inválida' }, { status: 400 });
    }

    const patient = await getPatientById(session.userId);
    if (!patient || !patient.wellnessPlan) {
      return NextResponse.json({ error: 'Paciente ou plano de bem-estar não encontrado' }, { status: 404 });
    }

    // Converter e salvar áudio no Storage
    // Evitar regex em string muito grande para evitar RangeError: Maximum call stack size exceeded
    if (!audioDataUri.startsWith('data:')) {
        return NextResponse.json({ error: 'Formato de áudio inválido' }, { status: 400 });
    }

    const commaIndex = audioDataUri.indexOf(',');
    if (commaIndex === -1) {
        return NextResponse.json({ error: 'Formato de áudio inválido' }, { status: 400 });
    }

    const meta = audioDataUri.substring(5, commaIndex);
    const base64Data = audioDataUri.substring(commaIndex + 1);
    const mimeType = meta.split(';')[0];

    const buffer = Buffer.from(base64Data, 'base64');
    let extension = 'wav';
    if (mimeType.includes('mpeg')) extension = 'mp3';
    else if (mimeType.includes('ogg')) extension = 'ogg';
    
    const storedUrl = await saveFileBuffer(buffer, `wellness-${section}.${extension}`, 'wellness-audio');

    const audioFieldMap: Record<AudioSection, keyof typeof patient.wellnessPlan> = {
      dietary: 'dietaryPlanAudioUri',
      exercise: 'exercisePlanAudioUri',
      mental: 'mentalWellnessPlanAudioUri',
    };

    const audioField = audioFieldMap[section];
    
    const updatedPlan = {
      ...patient.wellnessPlan,
      [audioField]: storedUrl,
    };

    await updatePatientWellnessPlan(session.userId, updatedPlan);

    console.log(`[Wellness Audio] ✅ Audio saved for section "${section}" - patient ${session.userId} at ${storedUrl}`);

    return NextResponse.json({ success: true, url: storedUrl });
  } catch (error: any) {
    console.error('[Wellness Audio] Error saving audio:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar áudio', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'patient') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') as AudioSection | null;

    if (!section || !['dietary', 'exercise', 'mental'].includes(section)) {
      return NextResponse.json({ error: 'Seção inválida' }, { status: 400 });
    }

    const patient = await getPatientById(session.userId);
    if (!patient || !patient.wellnessPlan) {
      return NextResponse.json({ error: 'Plano de bem-estar não encontrado' }, { status: 404 });
    }

    const audioFieldMap: Record<AudioSection, string | undefined> = {
      dietary: patient.wellnessPlan.dietaryPlanAudioUri,
      exercise: patient.wellnessPlan.exercisePlanAudioUri,
      mental: patient.wellnessPlan.mentalWellnessPlanAudioUri,
    };

    const audioUri = audioFieldMap[section];

    return NextResponse.json({ 
      hasAudio: !!audioUri,
      audioDataUri: audioUri || null,
      lastUpdated: patient.wellnessPlan.lastUpdated,
    });
  } catch (error: any) {
    console.error('[Wellness Audio] Error getting audio:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar áudio', details: error.message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
