
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { canUseResource, getUsageSummary, LimitType } from '@/lib/subscription-limits';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'patient') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const resourceType = searchParams.get('resource') as LimitType;

    if (resourceType) {
      // Verificar limite de um recurso específico
      const result = await canUseResource(session.userId, resourceType);
      return NextResponse.json(result);
    } else {
      // Retornar resumo completo
      const summary = await getUsageSummary(session.userId);
      return NextResponse.json(summary);
    }
  } catch (error: any) {
    console.error('Erro ao verificar limites:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar limites' },
      { status: 500 }
    );
  }
}
