
import 'dotenv/config';
import { stripe } from '../src/lib/stripe';
import { db } from '../server/storage';
import { subscriptionPlans } from '../shared/schema';
import { eq } from 'drizzle-orm';

const KNOWN_PLANS = {
  trial: {
    productId: 'prod_TOOL1CoWuwvH7s',
    priceId: 'price_1SRbYd3zDP3Guk8jf3FzcO10',
  },
  basico: {
    productId: 'prod_TOOL4iw2k4tn2a',
    priceId: 'price_1SRbYz3zDP3Guk8judMR3nqZ',
  },
  premium: {
    productId: 'prod_TOOMKH2gZ3B9Ul',
    priceId: 'price_1SRbZN3zDP3Guk8jbGO4ZgrT',
  },
};

async function fixStripeSync() {
  console.log('🔧 Iniciando correção da sincronização Stripe <-> DB...');

  // 1. Tratar o plano Familiar (criar se não existir)
  console.log('Checking Familiar plan...');
  let familiarProductId: string | undefined;
  let familiarPriceId: string | undefined;

  // Tentar encontrar o produto Familiar no Stripe
  const products = await stripe.products.list({ limit: 100 });
  const familiarProduct = products.data.find(p => p.name.toLowerCase().includes('familiar'));

  if (familiarProduct) {
    console.log(`✅ Produto Familiar encontrado: ${familiarProduct.id}`);
    familiarProductId = familiarProduct.id;
    
    // Buscar preço
    const prices = await stripe.prices.list({ product: familiarProductId, limit: 1 });
    if (prices.data.length > 0) {
      familiarPriceId = prices.data[0].id;
      console.log(`✅ Preço Familiar encontrado: ${familiarPriceId}`);
    }
  }

  if (!familiarProductId || !familiarPriceId) {
    console.log('⚠️  Plano Familiar incompleto ou inexistente no Stripe. Criando...');
    
    if (!familiarProductId) {
      const newProduct = await stripe.products.create({
        name: 'Familiar',
        description: 'Plano para toda a família',
      });
      familiarProductId = newProduct.id;
      console.log(`✨ Produto Familiar criado: ${familiarProductId}`);
    }

    if (!familiarPriceId && familiarProductId) {
      const newPrice = await stripe.prices.create({
        product: familiarProductId,
        unit_amount: 29790, // 297.90 BRL
        currency: 'brl',
        recurring: { interval: 'month' },
      });
      familiarPriceId = newPrice.id;
      console.log(`✨ Preço Familiar criado: ${familiarPriceId}`);
    }
  }

  // 2. Atualizar o Banco de Dados
  console.log('\n💾 Atualizando banco de dados...');

  const updates = [
    { id: 'trial', ...KNOWN_PLANS.trial },
    { id: 'basico', ...KNOWN_PLANS.basico },
    { id: 'premium', ...KNOWN_PLANS.premium },
    { id: 'familiar', productId: familiarProductId, priceId: familiarPriceId },
  ];

  for (const update of updates) {
    if (!update.productId || !update.priceId) {
      console.error(`❌ Ignorando atualização para ${update.id} - IDs faltando.`);
      continue;
    }

    console.log(`Atualizando ${update.id} com Product: ${update.productId}, Price: ${update.priceId}`);
    
    await db.update(subscriptionPlans)
      .set({
        stripeProductId: update.productId,
        stripePriceId: update.priceId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlans.id, update.id));
      
    console.log(`✅ ${update.id} atualizado.`);
  }

  console.log('\n✨ Sincronização concluída!');
}

fixStripeSync()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
