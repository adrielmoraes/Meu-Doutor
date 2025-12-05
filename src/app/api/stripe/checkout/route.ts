import { NextRequest, NextResponse } from 'next/server';
import { stripe, createCheckoutSession, createCustomer, migrateSubscription } from '@/lib/stripe';
import { getSubscriptionByPatientId, createOrUpdateSubscriptionPlan, upsertSubscription } from '@/lib/subscription-adapter';
import { getPatientById } from '@/lib/db-adapter';
import { getSession } from '@/lib/session';
import { getPlanIdFromStripePrice, isValidStripePriceId } from '@/lib/plan-mapping';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'patient') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { stripePriceId, paymentMethod = 'all' } = await req.json();

    if (!stripePriceId) {
      return NextResponse.json(
        { error: 'ID do preço Stripe é obrigatório' },
        { status: 400 }
      );
    }

    // Validar price ID e obter plan ID autoritativo do servidor
    if (!isValidStripePriceId(stripePriceId)) {
      return NextResponse.json(
        { error: 'ID de preço inválido' },
        { status: 400 }
      );
    }

    const planId = getPlanIdFromStripePrice(stripePriceId);
    if (!planId) {
      return NextResponse.json(
        { error: 'Não foi possível mapear o preço para um plano' },
        { status: 400 }
      );
    }

    const patient = await getPatientById(session.userId);
    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    const existingSubscription = await getSubscriptionByPatientId(session.userId);
    
    // Verificar se já teve trial antes
    if (planId === 'trial' && existingSubscription) {
      return NextResponse.json(
        { error: 'Você já utilizou o período de teste gratuito' },
        { status: 400 }
      );
    }
    
    // Se já tem assinatura ativa e não é trial, permitir migração
    if (existingSubscription && existingSubscription.status === 'active' && planId !== 'trial') {
      try {
        // Verificar se é uma subscription local (trial) ou do Stripe
        const stripeSubscriptionId = existingSubscription.stripeSubscriptionId || '';
        const isLocalTrial = stripeSubscriptionId.startsWith('local_trial_');
        
        if (isLocalTrial || !stripeSubscriptionId) {
          // Se é trial local ou não tem subscription ID, não tentar migrar no Stripe
          // Ao invés disso, criar um novo checkout para plano pago
          console.log('Trial local detectado, criando novo checkout ao invés de migrar');
          // Continuar com o fluxo normal de checkout
        } else {
          // Se é subscription válida do Stripe, fazer migração
          const migratedSubscription = await migrateSubscription(stripeSubscriptionId, stripePriceId);
          
          // Atualizar subscription no banco de dados
          await upsertSubscription({
            patientId: session.userId,
            planId: planId,
            stripeSubscriptionId: stripeSubscriptionId,
            stripeCustomerId: existingSubscription.stripeCustomerId,
            status: 'active',
            currentPeriodStart: new Date((migratedSubscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((migratedSubscription as any).current_period_end * 1000),
          });
          
          return NextResponse.json({ 
            success: true, 
            message: 'Plano atualizado com sucesso!',
            redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/patient/subscription?upgraded=true`
          });
        }
      } catch (error: any) {
        console.error('Erro ao fazer migração de plano:', error);
        return NextResponse.json(
          { error: 'Erro ao migrar para novo plano: ' + error.message },
          { status: 400 }
        );
      }
    }

    let customerId = existingSubscription?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await createCustomer({
        email: patient.email,
        name: patient.name,
        metadata: {
          patientId: session.userId,
        },
      });
      customerId = customer.id;
    }

    // Construir base URL de forma segura - priorizar domínio customizado
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 
                    `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    
    // Para trial, criar subscription direta sem checkout (sem necessidade de cartão)
    if (planId === 'trial') {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      const trialEndTimestamp = Math.floor(trialEndDate.getTime() / 1000);
      
      // Criar subscription com trial sem payment method
      // cancel_at garante que a subscription seja automaticamente cancelada após 7 dias
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: stripePriceId }],
        trial_end: trialEndTimestamp,
        cancel_at: trialEndTimestamp,
        metadata: {
          patientId: session.userId,
          planId: planId,
          stripePriceId: stripePriceId,
        },
      });

      // Salvar subscription no banco
      const { upsertSubscription } = await import('@/lib/subscription-adapter');
      await upsertSubscription({
        patientId: session.userId,
        planId: planId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        status: 'trialing',
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      });

      return NextResponse.json({ 
        success: true, 
        redirectUrl: `${baseUrl}/patient/subscription/success?trial=true` 
      });
    }
    
    // Para planos pagos, usar checkout session normal
    const checkoutSession = await createCheckoutSession({
      priceId: stripePriceId,
      customerId,
      paymentMethod: paymentMethod,
      metadata: {
        patientId: session.userId,
        planId: planId,
        stripePriceId: stripePriceId,
      },
      successUrl: `${baseUrl}/patient/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/patient/subscription/canceled`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar sessão de checkout' },
      { status: 500 }
    );
  }
}
