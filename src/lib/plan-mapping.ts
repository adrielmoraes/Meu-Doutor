// Mapeamento autoritativo de Stripe Price IDs para IDs de planos internos
// Este mapeamento deve ser a única fonte de verdade para determinar qual plano um usuário está comprando

export const STRIPE_PRICE_TO_PLAN_MAP: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_TRIAL_PRICE_ID || 'price_1SRbYd3zDP3Guk8jf3FzcO10']: 'trial',
  [process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_1SRbYz3zDP3Guk8judMR3nqZ']: 'basico',
  [process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'price_1SRbZN3zDP3Guk8jbGO4ZgrT']: 'premium',
  [process.env.NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID || 'price_1SftE63zDP3Guk8jqwexhX8j']: 'familiar',
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
