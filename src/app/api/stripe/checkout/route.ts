import { NextRequest, NextResponse } from 'next/server';
import { stripe, createCheckoutSession, createCustomer } from '@/lib/stripe';
import { getSubscriptionByPatientId, createOrUpdateSubscriptionPlan } from '@/lib/subscription-adapter';
import { getPatientById } from '@/lib/db-adapter';
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

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'ID do plano é obrigatório' },
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
    
    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura ativa' },
        { status: 400 }
      );
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

    const baseUrl = process.env.REPLIT_DOMAINS || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
    
    const checkoutSession = await createCheckoutSession({
      priceId: planId,
      customerId,
      metadata: {
        patientId: session.userId,
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
