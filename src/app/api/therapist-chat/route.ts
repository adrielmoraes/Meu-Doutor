import { NextRequest, NextResponse } from 'next/server';
import { therapistChat } from '@/ai/flows/therapist-chat-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { getPatientById, updatePatient, trackUsage } from '@/lib/db-adapter';

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

    const patient = await getPatientById(patientId);
    if (patient) {
      const updatedHistory = `${patient.conversationHistory || ''}\n[${new Date().toISOString()}]\nPaciente: ${message}\nTerapeuta IA: ${chatResponse.response}`;
      await updatePatient(patientId, {
        conversationHistory: updatedHistory.substring(0, 10000),
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
          response: chatResponse.response, // Still return text for logging/debugging but client will ignore for display
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
