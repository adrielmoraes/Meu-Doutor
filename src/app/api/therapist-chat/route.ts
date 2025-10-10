import { NextRequest, NextResponse } from 'next/server';
import { therapistChat } from '@/ai/flows/therapist-chat-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { getPatientById, updatePatient } from '@/lib/db-adapter';

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

    if (isAudioRequest) {
      const audioResponse = await textToSpeech({ text: chatResponse.response });
      
      if (audioResponse && audioResponse.audioDataUri) {
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
