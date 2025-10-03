import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceName = 'Puck' } = body;

    if (!text) {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 });
    }

    // Usar Gemini 2.5 Flash TTS para gerar áudio
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ 
        parts: [{ text: `Fale em português brasileiro de forma natural e clara: ${text}` }] 
      }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    });
    
    // Extrair o áudio em base64 da resposta
    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    
    if (!audioPart || !audioPart.inlineData?.data) {
      throw new Error('Nenhum áudio gerado pelo Gemini');
    }

    // Retornar áudio em formato compatível com TalkingHead
    return NextResponse.json({
      audioContent: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || 'audio/pcm'
    });

  } catch (error: any) {
    console.error('Erro no Gemini TTS:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao processar TTS',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
