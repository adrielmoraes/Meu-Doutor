import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não está definida nas variáveis de ambiente');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export async function createCheckoutSession(params: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  paymentMethod?: 'card' | 'pix' | 'all';
}) {
  // Determinar quais métodos de pagamento usar
  const paymentMethodTypes = params.paymentMethod === 'all' 
    ? ['card', 'pix']
    : params.paymentMethod === 'pix'
    ? ['pix']
    : ['card'];

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: paymentMethodTypes,
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer: params.customerId,
    customer_email: params.customerEmail,
    metadata: params.metadata,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    locale: 'pt-BR',
  });

  return session;
}

export async function createCustomer(params: {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}) {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata,
  });

  return customer;
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

export async function resumeSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}

export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

export async function migrateSubscription(
  subscriptionId: string,
  newPriceId: string
) {
  // Obter a subscription atual para pegar o item ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  if (!subscription.items.data || subscription.items.data.length === 0) {
    throw new Error('Subscription sem items');
  }

  // Atualizar o subscription com o novo price, mantendo o resto igual
  const updatedSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations', // Criar créditos/cobranças por diferença
    }
  );

  return updatedSubscription;
}

export async function createProduct(params: {
  name: string;
  description: string;
}) {
  const product = await stripe.products.create({
    name: params.name,
    description: params.description,
  });

  return product;
}

export async function createPrice(params: {
  productId: string;
  unitAmount: number;
  currency?: string;
  interval?: 'month' | 'year';
}) {
  const price = await stripe.prices.create({
    product: params.productId,
    unit_amount: params.unitAmount,
    currency: params.currency || 'brl',
    recurring: {
      interval: params.interval || 'month',
    },
  });

  return price;
}
