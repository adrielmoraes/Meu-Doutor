import { NextRequest, NextResponse } from 'next/server';
import { therapistChat } from '@/ai/flows/therapist-chat-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { getPatientById, updatePatient, trackUsage } from '@/lib/db-adapter';

const MAX_HISTORY_MESSAGES = 40; // 20 interações = 40 mensagens (user + assistant)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, message, isAudioRequest, conversationHistory } = body;

    if (!patientId || !message) {
      return NextResponse.json(
        { error: 'patientId e message são obrigatórios' },
        { status: 400 }
      );
    }

    const chatResponse = await therapistChat({
      patientId,
      message,
      conversationHistory: conversationHistory || [],
    });

    if (!chatResponse || !chatResponse.response) {
      return NextResponse.json(
        { error: 'Erro ao gerar resposta do terapeuta' },
        { status: 500 }
      );
    }

    // ── Save conversation history as JSON (limited to 20 interactions) ──
    const patient = await getPatientById(patientId);
    if (patient) {
      // Parse existing history (handle legacy text format)
      let existingHistory: Array<{ role: string; content: string }> = [];
      if (patient.conversationHistory) {
        try {
          const parsed = JSON.parse(patient.conversationHistory);
          if (Array.isArray(parsed)) {
            existingHistory = parsed;
          }
        } catch {
          // Legacy format: ignore old text, start fresh JSON
          existingHistory = [];
        }
      }

      // Append user message and assistant response
      existingHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: chatResponse.response }
      );

      // Keep only the last 20 interactions (40 messages)
      if (existingHistory.length > MAX_HISTORY_MESSAGES) {
        existingHistory = existingHistory.slice(-MAX_HISTORY_MESSAGES);
      }

      // Save as JSON string
      await updatePatient(patientId, {
        conversationHistory: JSON.stringify(existingHistory),
      });
    }

    // Track chat usage with real cost calculation
    trackUsage({
      patientId,
      usageType: 'chat',
      model: 'gemini-2.5-flash',
      inputText: message,
      outputText: chatResponse.response,
      metadata: {
        conversationHistoryLength: conversationHistory?.length || 0,
        messageType: 'therapist_chat'
      },
    }).catch(error => {
      console.error('[Usage Tracking] Failed to track therapist chat:', error);
    });

    if (isAudioRequest) {
      const audioResponse = await textToSpeech({ text: chatResponse.response });

      if (audioResponse && audioResponse.audioDataUri) {
        // Track TTS usage with real cost calculation
        trackUsage({
          patientId,
          usageType: 'tts',
          model: 'gemini-2.5-flash-preview-tts',
          outputText: chatResponse.response,
          metadata: { textLength: chatResponse.response.length },
        }).catch(error => {
          console.error('[Usage Tracking] Failed to track TTS:', error);
        });

        return NextResponse.json({
          response: chatResponse.response,
          audioDataUri: audioResponse.audioDataUri,
        });
      }
    }

    return NextResponse.json({
      response: chatResponse.response,
    });

  } catch (error: any) {
    console.error('Erro no chat do terapeuta:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
