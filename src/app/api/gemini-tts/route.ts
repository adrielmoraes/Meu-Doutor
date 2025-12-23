import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getSession } from '@/lib/session';
import { trackTTS } from '@/lib/usage-tracker';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 });
    }

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
              voiceName: 'Despina'
            }
          }
        }
      }
    });
    
    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    
    if (!audioPart || !audioPart.inlineData?.data) {
      console.error('Resposta Gemini:', JSON.stringify(response, null, 2));
      throw new Error('Nenhum áudio gerado pelo Gemini');
    }

    trackTTS(session.userId, text, 0, 'gemini-2.5-flash-preview-tts').catch((err) => {
      console.error('[TTS Cost Tracking] Error:', err);
    });

    return NextResponse.json({
      audioContent: audioPart.inlineData.data,
      mimeType: 'audio/pcm',
      sampleRate: 24000,
      channels: 1,
      bitDepth: 16
    });

  } catch (error: any) {
    console.error('Erro no Gemini TTS:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Erro ao processar TTS',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
