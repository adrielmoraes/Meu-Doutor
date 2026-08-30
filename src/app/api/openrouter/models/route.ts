import { NextResponse } from 'next/server';
import { 
  isOpenRouterConfigured, 
  listCuratedOpenRouterModels, 
  DEFAULT_OPENROUTER_MODEL 
} from '@/lib/openrouter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configured = isOpenRouterConfigured();
    const defaultModel = process.env.OPENROUTER_DEFAULT_MODEL || DEFAULT_OPENROUTER_MODEL;
    const models = listCuratedOpenRouterModels();

    return NextResponse.json({
      configured,
      defaultModel,
      models,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar modelos da OpenRouter' },
      { status: 500 }
    );
  }
}
