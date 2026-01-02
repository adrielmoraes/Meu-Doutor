import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPatientById, updatePatientWellnessPlanAudio } from '@/lib/db-adapter';
import { saveFileBuffer } from '@/lib/file-storage';
import { revalidatePath } from 'next/cache';
import { textToSpeech } from '@/ai/flows/text-to-speech';

type AudioSection = 'dietary' | 'exercise' | 'mental';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'patient') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { section, audioDataUri, text } = body as { section: AudioSection; audioDataUri?: string; text?: string };

    if (!section || (!audioDataUri && !text)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    if (!['dietary', 'exercise', 'mental'].includes(section)) {
      return NextResponse.json({ error: 'Seção inválida' }, { status: 400 });
    }

    const patient = await getPatientById(session.userId);
    if (!patient || !patient.wellnessPlan) {
      return NextResponse.json({ error: 'Paciente ou plano de bem-estar não encontrado' }, { status: 404 });
    }

    const existingAudioUriMap: Record<AudioSection, string | undefined> = {
      dietary: patient.wellnessPlan.dietaryPlanAudioUri,
      exercise: patient.wellnessPlan.exercisePlanAudioUri,
      mental: patient.wellnessPlan.mentalWellnessPlanAudioUri,
    };

    const existingAudioUri = existingAudioUriMap[section];
    if (existingAudioUri && !audioDataUri) {
      return NextResponse.json({ success: true, url: existingAudioUri, reused: true });
    }

    let buffer: Buffer;
    let extension = 'wav';

    if (audioDataUri) {
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

      buffer = Buffer.from(base64Data, 'base64');
      if (mimeType.includes('mpeg')) extension = 'mp3';
      else if (mimeType.includes('ogg')) extension = 'ogg';
    } else {
      const trimmedText = (text || '').trim();
      if (!trimmedText) {
        return NextResponse.json({ error: 'Texto inválido' }, { status: 400 });
      }
      if (trimmedText.length > 6000) {
        return NextResponse.json({ error: 'Texto muito longo para gerar áudio' }, { status: 413 });
      }

      const tts = await textToSpeech({
        text: trimmedText,
        patientId: session.userId,
        returnBuffer: true,
      });

      if (!tts?.audioBuffer || !(tts.audioBuffer instanceof Buffer)) {
        return NextResponse.json({ error: 'Falha ao gerar áudio' }, { status: 500 });
      }

      buffer = tts.audioBuffer;
      extension = 'wav';
    }
    
    const storedUrl = await saveFileBuffer(buffer, `wellness-${section}.${extension}`, 'wellness-audio');

    // Use atomic update to prevent race conditions and data loss
    try {
      await updatePatientWellnessPlanAudio(session.userId, section, storedUrl);
      revalidatePath('/patient/wellness');
    } catch (dbError) {
      console.error('[Wellness Audio] Warning: Failed to update DB with audio URL, but file was saved:', dbError);
      // We continue because the audio file was successfully created and can be played
    }

    console.log(`[Wellness Audio] ✅ Audio saved for section "${section}" - patient ${session.userId} at ${storedUrl}`);

    return NextResponse.json({ success: true, url: storedUrl, reused: false });
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
