// Mapeamento autoritativo de Stripe Price IDs para IDs de planos internos
// Este mapeamento deve ser a única fonte de verdade para determinar qual plano um usuário está comprando

export const STRIPE_PRICE_TO_PLAN_MAP: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || '']: 'basico',
  [process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '']: 'premium',
  [process.env.NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID || '']: 'familiar',
};

export function getPlanIdFromStripePrice(stripePriceId: string): string | null {
  return STRIPE_PRICE_TO_PLAN_MAP[stripePriceId] || null;
}

export function isValidStripePriceId(stripePriceId: string): boolean {
  return stripePriceId in STRIPE_PRICE_TO_PLAN_MAP;
}

export function getAllowedPriceIds(): string[] {
  return Object.keys(STRIPE_PRICE_TO_PLAN_MAP).filter(id => id !== '');
}
