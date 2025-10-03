import { NextRequest, NextResponse } from 'next/server';
import { updateCallRecording, saveConsultation } from '@/lib/db-adapter';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const roomId = formData.get('roomId') as string;
    const patientId = formData.get('patientId') as string;
    const doctorId = formData.get('doctorId') as string;

    if (!audioFile || !roomId || !patientId || !doctorId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando' },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const transcriptionPrompt = `Você é um assistente médico especializado em transcrever consultas médicas.
Transcreva com precisão a conversa de áudio entre médico e paciente.
Identifique quem está falando (Médico ou Paciente) e formate a transcrição de forma clara.
Mantenha todos os termos médicos e detalhes clínicos mencionados.`;

    const transcriptionResult = await model.generateContent([
      {
        inlineData: {
          mimeType: 'audio/webm',
          data: audioBase64
        }
      },
      { text: transcriptionPrompt }
    ]);

    const transcription = transcriptionResult.response.text();

    const summaryPrompt = `Com base na seguinte transcrição de uma consulta médica, crie um resumo estruturado em português brasileiro que inclua:

1. **Queixa Principal**: O motivo da consulta
2. **Sintomas Relatados**: Lista de sintomas mencionados pelo paciente
3. **Histórico Relevante**: Informações importantes do histórico médico mencionadas
4. **Exames Solicitados**: Se o médico solicitou algum exame
5. **Diagnóstico Preliminar**: Se houve algum diagnóstico mencionado
6. **Prescrições/Orientações**: Medicamentos ou orientações dadas pelo médico
7. **Observações Importantes**: Qualquer informação adicional relevante

Transcrição:
${transcription}

Formate o resumo de forma profissional e clara, adequado para registro médico.`;

    const summaryResult = await model.generateContent(summaryPrompt);
    const summary = summaryResult.response.text();

    await updateCallRecording(roomId, transcription, summary);
    await saveConsultation(doctorId, patientId, roomId, transcription, summary, 'video-call');

    return NextResponse.json({
      success: true,
      summary,
      transcription: transcription.substring(0, 200) + '...',
    });

  } catch (error) {
    console.error('Erro ao processar gravação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
