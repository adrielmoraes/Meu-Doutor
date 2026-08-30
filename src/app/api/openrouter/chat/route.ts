import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { 
  openRouterChatCompletion, 
  openRouterStreamChatCompletion, 
  isOpenRouterConfigured,
  OpenRouterMessage 
} from '@/lib/openrouter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticação do usuário
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para utilizar os serviços de IA.' },
        { status: 401 }
      );
    }

    // 2. Verificar se a OpenRouter está configurada
    if (!isOpenRouterConfigured()) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY não configurada no servidor (.env).' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { 
      messages, 
      model, 
      systemPrompt, 
      temperature, 
      maxTokens, 
      stream = false 
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Parâmetro "messages" obrigatório e deve ser uma lista não-vazia.' },
        { status: 400 }
      );
    }

    // 3. Caso seja modo streaming (Server-Sent Events)
    if (stream) {
      const responseStream = new TransformStream();
      const writer = responseStream.writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          const generator = openRouterStreamChatCompletion({
            messages: messages as OpenRouterMessage[],
            model,
            systemPrompt,
            temperature,
            maxTokens,
          });

          for await (const chunk of generator) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }
          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch (streamError: any) {
          console.error('[OpenRouter API Stream Error]:', streamError);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: streamError.message })}\n\n`));
        } finally {
          await writer.close();
        }
      })();

      return new Response(responseStream.readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }

    // 4. Modo padrão (Non-streaming JSON response)
    const result = await openRouterChatCompletion({
      messages: messages as OpenRouterMessage[],
      model,
      systemPrompt,
      temperature,
      maxTokens,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('[OpenRouter API Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar requisição na OpenRouter' },
      { status: 500 }
    );
  }
}
