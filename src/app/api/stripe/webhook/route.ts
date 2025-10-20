import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { 
  upsertSubscription, 
  updateSubscription, 
  getSubscriptionByStripeId,
  upsertPayment,
  updatePayment 
} from '@/lib/subscription-adapter';
import { headers } from 'next/headers';
import { getPlanIdFromStripePrice } from '@/lib/plan-mapping';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET não está configurado');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Assinatura do webhook ausente' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Erro na verificação do webhook: ${err.message}`);
      return NextResponse.json(
        { error: `Erro no webhook: ${err.message}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const patientId = session.metadata?.patientId;
        const stripePriceId = session.metadata?.stripePriceId;
        const subscriptionId = session.subscription as string;

        if (patientId && subscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Determinar planId de forma autoritativa do mapeamento servidor
          let planId = stripePriceId ? getPlanIdFromStripePrice(stripePriceId) : null;
          
          // Fallback: usar o price do primeiro item da subscription
          if (!planId && stripeSubscription.items.data.length > 0) {
            const itemPriceId = stripeSubscription.items.data[0].price.id;
            planId = getPlanIdFromStripePrice(itemPriceId);
          }
          
          // Se ainda não temos planId, logar e usar 'basico' como fallback
          if (!planId) {
            console.error('Não foi possível determinar planId para subscription:', subscriptionId);
            planId = 'basico';
          }
          
          await upsertSubscription({
            patientId,
            planId,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: session.customer as string,
            status: stripeSubscription.status as any,
            currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const dbSubscription = await getSubscriptionByStripeId(subscription.id);

        if (dbSubscription) {
          await updateSubscription(dbSubscription.id, {
            status: subscription.status as any,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const dbSubscription = await getSubscriptionByStripeId(subscription.id);

        if (dbSubscription) {
          await updateSubscription(dbSubscription.id, {
            status: 'canceled',
            canceledAt: new Date(),
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        const dbSubscription = await getSubscriptionByStripeId(subscriptionId);

        if (dbSubscription && invoice.payment_intent) {
          await upsertPayment({
            subscriptionId: dbSubscription.id,
            patientId: dbSubscription.patientId,
            stripePaymentIntentId: invoice.payment_intent as string,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'succeeded',
            paidAt: new Date(),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        const dbSubscription = await getSubscriptionByStripeId(subscriptionId);

        if (dbSubscription && invoice.payment_intent) {
          await upsertPayment({
            subscriptionId: dbSubscription.id,
            patientId: dbSubscription.patientId,
            stripePaymentIntentId: invoice.payment_intent as string,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: 'failed',
            failedAt: new Date(),
            failureReason: invoice.last_payment_error?.message || 'Falha no pagamento',
          });

          await updateSubscription(dbSubscription.id, {
            status: 'past_due',
          });
        }
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}
