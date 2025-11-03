import { NextRequest, NextResponse } from 'next/server';
import { resumeSubscription } from '@/lib/stripe';
import { getSubscriptionByPatientId, updateSubscription } from '@/lib/subscription-adapter';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'patient') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const subscription = await getSubscriptionByPatientId(session.userId);
    
    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      );
    }

    if (!subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Assinatura não está marcada para cancelamento' },
        { status: 400 }
      );
    }

    await resumeSubscription(subscription.stripeSubscriptionId);
    
    await updateSubscription(subscription.id, {
      cancelAtPeriodEnd: false,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Assinatura reativada com sucesso!' 
    });
  } catch (error: any) {
    console.error('Erro ao reativar assinatura:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao reativar assinatura' },
      { status: 500 }
    );
  }
}
