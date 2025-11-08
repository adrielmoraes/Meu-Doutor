import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionByPatientId, getSubscriptionPlanById } from '@/lib/subscription-adapter';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'patient') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const subscription = await getSubscriptionByPatientId(session.userId);
    
    if (!subscription) {
      return NextResponse.json({ 
        hasActiveSubscription: false,
        subscription: null 
      });
    }

    const hasActiveSubscription = subscription.status === 'active' || subscription.status === 'trialing';

    // Buscar informações do plano
    let planName = 'Plano Desconhecido';
    if (subscription.planId) {
      const plan = await getSubscriptionPlanById(subscription.planId);
      if (plan) {
        planName = plan.name;
      }
    }

    return NextResponse.json({ 
      hasActiveSubscription,
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        planName: planName,
      }
    });
  } catch (error: any) {
    console.error('Erro ao verificar status da assinatura:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar status da assinatura' },
      { status: 500 }
    );
  }
}
