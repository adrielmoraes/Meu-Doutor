import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: 'Áudio não fornecido' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: audioFile.type || 'audio/webm'
            }
          },
          {
            text: 'Transcreva este áudio em português brasileiro. Retorne apenas o texto transcrito, sem comentários adicionais.'
          }
        ]
      }]
    });

    const textPart = response.candidates?.[0]?.content?.parts?.find((part: any) => part.text);
    const transcript = textPart?.text || '';

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      console.error('Resposta Gemini:', JSON.stringify(response, null, 2));
      throw new Error('Falha ao transcrever áudio');
    }

    return NextResponse.json({ transcript: transcript.trim() });

  } catch (error: any) {
    console.error('Erro no Speech-to-Text:', error);
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
