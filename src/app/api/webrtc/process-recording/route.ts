import { NextRequest, NextResponse } from 'next/server';
import { saveConsultation } from '@/lib/db-adapter';
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const transcriptionPrompt = `Você é um assistente médico especializado em transcrever consultas médicas.\nTranscreva com precisão a conversa de áudio entre médico e paciente.\nIdentifique quem está falando (Médico ou Paciente) e formate a transcrição de forma clara.\nMantenha todos os termos médicos e detalhes clínicos mencionados.`;

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

    const summaryPrompt = `Com base na seguinte transcrição de uma consulta médica, crie um resumo estruturado em português brasileiro que inclua:\n\n1. **Queixa Principal**: O motivo da consulta\n2. **Sintomas Relatados**: Lista de sintomas mencionados pelo paciente\n3. **Histórico Relevante**: Informações importantes do histórico médico mencionadas\n4. **Exames Solicitados**: Se o médico solicitou algum exame\n5. **Diagnóstico Preliminar**: Se houve algum diagnóstico mencionado\n6. **Prescrições/Orientações**: Medicamentos ou orientações dadas pelo médico\n7. **Observações Importantes**: Qualquer informação adicional relevante\n\nTranscrição:\n${transcription}\n\nFormate o resumo de forma profissional e clara, adequado para registro médico.`;

    const summaryResult = await model.generateContent(summaryPrompt);
    const summary = summaryResult.response.text();

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
