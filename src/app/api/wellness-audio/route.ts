import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPatientById, updatePatientWellnessPlanAudio } from '@/lib/db-adapter';
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

    // Generate new audio (or use provided data URI)
    let dataUri: string;

    if (audioDataUri) {
      // Audio already provided as data URI
      if (!audioDataUri.startsWith('data:')) {
        return NextResponse.json({ error: 'Formato de áudio inválido' }, { status: 400 });
      }
      dataUri = audioDataUri;
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
        returnBuffer: false, // Get data URI directly
      });

      if (!tts?.audioDataUri) {
        return NextResponse.json({ error: 'Falha ao gerar áudio' }, { status: 500 });
      }

      dataUri = tts.audioDataUri;
    }

    // Validate data URI size (max 5MB to prevent DB bloat)
    const MAX_AUDIO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    const dataUriBytes = Buffer.byteLength(dataUri, 'utf8');
    if (dataUriBytes > MAX_AUDIO_SIZE_BYTES) {
      console.warn(`[Wellness Audio] ⚠️ Audio too large: ${(dataUriBytes / 1024 / 1024).toFixed(2)}MB`);
      return NextResponse.json(
        { error: 'Áudio muito grande. Por favor, tente um texto mais curto.' },
        { status: 413 }
      );
    }

    // Save the data URI directly to the database for persistence
    try {
      await updatePatientWellnessPlanAudio(session.userId, section, dataUri);
      revalidatePath('/patient/wellness');
      console.log(`[Wellness Audio] ✅ Audio saved to database for section "${section}" (${(dataUriBytes / 1024).toFixed(1)}KB) - patient ${session.userId}`);
    } catch (dbError: any) {
      console.error('[Wellness Audio] Failed to save audio to database:', dbError);
      return NextResponse.json(
        { error: 'Falha ao salvar áudio no banco de dados', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: dataUri, reused: false });
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
