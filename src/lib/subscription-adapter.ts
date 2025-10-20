import { db } from '../../server/storage';
import { subscriptionPlans, subscriptions, payments } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function getSubscriptionPlans() {
  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.active, true))
    .orderBy(subscriptionPlans.price);
  
  return plans;
}

export async function getSubscriptionPlanById(planId: string) {
  const plan = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, planId))
    .limit(1);
  
  return plan[0] || null;
}

export async function createSubscription(data: {
  patientId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}) {
  const id = randomUUID();
  
  await db.insert(subscriptions).values({
    id,
    patientId: data.patientId,
    planId: data.planId,
    stripeSubscriptionId: data.stripeSubscriptionId,
    stripeCustomerId: data.stripeCustomerId,
    status: data.status,
    currentPeriodStart: data.currentPeriodStart,
    currentPeriodEnd: data.currentPeriodEnd,
  });
  
  return id;
}

export async function updateSubscription(subscriptionId: string, data: Partial<{
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date;
}>) {
  await db
    .update(subscriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function getSubscriptionByPatientId(patientId: string) {
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.patientId, patientId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  
  return subscription[0] || null;
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  
  return subscription[0] || null;
}

export async function createPayment(data: {
  subscriptionId: string;
  patientId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency?: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paidAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}) {
  const id = randomUUID();
  
  await db.insert(payments).values({
    id,
    subscriptionId: data.subscriptionId,
    patientId: data.patientId,
    stripePaymentIntentId: data.stripePaymentIntentId,
    amount: data.amount,
    currency: data.currency || 'brl',
    status: data.status,
    paidAt: data.paidAt,
    failedAt: data.failedAt,
    failureReason: data.failureReason,
  });
  
  return id;
}

export async function updatePayment(paymentId: string, data: Partial<{
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paidAt: Date;
  failedAt: Date;
  failureReason: string;
}>) {
  await db
    .update(payments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(payments.id, paymentId));
}

export async function getPaymentsBySubscriptionId(subscriptionId: string) {
  const paymentsList = await db
    .select()
    .from(payments)
    .where(eq(payments.subscriptionId, subscriptionId))
    .orderBy(desc(payments.createdAt));
  
  return paymentsList;
}

export async function getPaymentsByPatientId(patientId: string) {
  const paymentsList = await db
    .select()
    .from(payments)
    .where(eq(payments.patientId, patientId))
    .orderBy(desc(payments.createdAt));
  
  return paymentsList;
}

export async function createOrUpdateSubscriptionPlan(data: {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  interval?: string;
  features: string[];
  stripePriceId?: string;
  stripeProductId?: string;
  active?: boolean;
}) {
  const id = data.id || randomUUID();
  
  const existingPlan = data.id ? await getSubscriptionPlanById(data.id) : null;
  
  if (existingPlan) {
    await db
      .update(subscriptionPlans)
      .set({
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency || 'brl',
        interval: data.interval || 'month',
        features: data.features,
        stripePriceId: data.stripePriceId,
        stripeProductId: data.stripeProductId,
        active: data.active !== undefined ? data.active : true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlans.id, id));
  } else {
    await db.insert(subscriptionPlans).values({
      id,
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency || 'brl',
      interval: data.interval || 'month',
      features: data.features,
      stripePriceId: data.stripePriceId,
      stripeProductId: data.stripeProductId,
      active: data.active !== undefined ? data.active : true,
    });
  }
  
  return id;
}
