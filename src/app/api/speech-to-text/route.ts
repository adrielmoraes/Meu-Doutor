import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: 'Áudio não fornecido' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // Usar Gemini 1.5 Flash que tem suporte robusto para áudio
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Audio,
          mimeType: audioFile.type || 'audio/webm'
        }
      },
      'Transcreva este áudio em português brasileiro. Retorne apenas o texto transcrito, sem comentários adicionais.'
    ]);

    const response = await result.response;
    const transcript = response.text();

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      console.error('Resposta Gemini vazia ou inválida');
      throw new Error('Falha ao transcrever áudio');
    }

    return NextResponse.json({ transcript: transcript.trim() });

  } catch (error: any) {
    console.error('Erro no Speech-to-Text:', error);
    console.error('Detalhes do erro:', error.message);
    return NextResponse.json(
      { 
        error: 'Erro ao processar transcrição',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
