import { NextRequest, NextResponse } from 'next/server';
import { cancelSubscription } from '@/lib/stripe';
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

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Assinatura não está ativa' },
        { status: 400 }
      );
    }

    await cancelSubscription(subscription.stripeSubscriptionId);
    
    await updateSubscription(subscription.id, {
      cancelAtPeriodEnd: true,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Assinatura cancelada. Você terá acesso até o final do período atual.' 
    });
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao cancelar assinatura' },
      { status: 500 }
    );
  }
}
