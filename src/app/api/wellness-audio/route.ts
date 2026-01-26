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
      dietary: patient.wellnessPlan.preliminaryAnalysisAudioUri,
      exercise: patient.wellnessPlan.exercisePlanAudioUri,
      mental: patient.wellnessPlan.mentalWellnessPlanAudioUri,
    };

    const existingAudioUri = existingAudioUriMap[section];
    
    // Only reuse existing audio if no new content is provided (regeneration request)
    if (existingAudioUri && !audioDataUri && !text) {
      console.log(`[Wellness Audio] ♻️ Reusing existing audio for section "${section}"`);
      return NextResponse.json({ success: true, url: existingAudioUri, reused: true });
    }

    // Generate new audio
    let audioBuffer: Buffer;

    if (audioDataUri) {
      // Audio already provided as data URI - extract buffer
      if (!audioDataUri.startsWith('data:')) {
        return NextResponse.json({ error: 'Formato de áudio inválido' }, { status: 400 });
      }
      const commaIndex = audioDataUri.indexOf(',');
      if (commaIndex === -1) {
        return NextResponse.json({ error: 'Formato de áudio inválido' }, { status: 400 });
      }
      const base64Data = audioDataUri.substring(commaIndex + 1);
      audioBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Generate audio from text using TTS
      const trimmedText = (text || '').trim();
      if (!trimmedText) {
        return NextResponse.json({ error: 'Texto inválido' }, { status: 400 });
      }
      if (trimmedText.length > 6000) {
        return NextResponse.json({ error: 'Texto muito longo para gerar áudio' }, { status: 413 });
      }

      console.log(`[Wellness Audio] 🎤 Generating TTS for section "${section}" (${trimmedText.length} chars)`);

      const tts = await textToSpeech({
        text: trimmedText,
        patientId: session.userId,
        returnBuffer: true,
      });

      if (!tts?.audioBuffer || !(tts.audioBuffer instanceof Buffer)) {
        return NextResponse.json({ error: 'Falha ao gerar áudio' }, { status: 500 });
      }

      audioBuffer = tts.audioBuffer;
    }

    // Validate audio size (max 10MB)
    const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;
    if (audioBuffer.length > MAX_AUDIO_SIZE_BYTES) {
      console.warn(`[Wellness Audio] ⚠️ Audio too large: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      return NextResponse.json(
        { error: 'Áudio muito grande. Por favor, tente um texto mais curto.' },
        { status: 413 }
      );
    }

    // Upload to Vercel Blob Storage
    const fileName = `wellness-${section}-${session.userId.slice(0, 8)}.wav`;
    let storedUrl: string;
    
    try {
      storedUrl = await saveFileBuffer(audioBuffer, fileName, 'wellness-audio');
      console.log(`[Wellness Audio] ☁️ Audio uploaded to storage: ${storedUrl} (${(audioBuffer.length / 1024).toFixed(1)}KB)`);
    } catch (storageError: any) {
      console.error('[Wellness Audio] Failed to upload audio to storage:', storageError);
      return NextResponse.json(
        { error: 'Falha ao fazer upload do áudio', details: storageError.message },
        { status: 500 }
      );
    }

    // Save the URL to the database
    try {
      await updatePatientWellnessPlanAudio(session.userId, section, storedUrl);
      revalidatePath('/patient/wellness');
      console.log(`[Wellness Audio] ✅ Audio URL saved to database for section "${section}" - patient ${session.userId}`);
    } catch (dbError: any) {
      console.error('[Wellness Audio] Failed to save audio URL to database:', dbError);
      return NextResponse.json(
        { error: 'Falha ao salvar URL do áudio no banco de dados', details: dbError.message },
        { status: 500 }
      );
    }

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
      dietary: patient.wellnessPlan.preliminaryAnalysisAudioUri,
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
