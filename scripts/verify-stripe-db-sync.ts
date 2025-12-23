
import 'dotenv/config';
import { stripe } from '../src/lib/stripe';
import { db } from '../server/storage';
import { subscriptionPlans } from '../shared/schema';

async function verifyStripeIntegration() {
  console.log('🔍 Iniciando verificação da integração Stripe <-> Banco de Dados...');

  // 1. Verificar conexão com Stripe
  try {
    console.log('📡 Testando conexão com Stripe...');
    const products = await stripe.products.list({ limit: 10 });
    console.log(`✅ Conexão com Stripe bem-sucedida! Encontrados ${products.data.length} produtos.`);
    
    for (const p of products.data) {
      console.log(`   - Produto: ${p.name} (ID: ${p.id})`);
      const prices = await stripe.prices.list({ product: p.id, limit: 5 });
      prices.data.forEach(price => {
        console.log(`     - Preço: ${price.unit_amount ? price.unit_amount / 100 : 0} ${price.currency} (ID: ${price.id}) [Tipo: ${price.type}]`);
      });
    }
  } catch (error: any) {
    console.error('❌ Falha na conexão com Stripe:', error.message);
    process.exit(1);
  }

  // 2. Verificar Planos no Banco de Dados
  console.log('\n🗄️  Verificando planos no banco de dados...');
  const dbPlans = await db.select().from(subscriptionPlans);
  console.log(`✅ Encontrados ${dbPlans.length} planos no banco.`);

  dbPlans.forEach(plan => {
    console.log(`   - Plano DB: ${plan.name} (ID: ${plan.id})`);
    console.log(`     Preço DB: ${plan.price / 100} ${plan.currency}`);
    console.log(`     Stripe Product ID: ${plan.stripeProductId || 'NÃO DEFINIDO'}`);
    console.log(`     Stripe Price ID: ${plan.stripePriceId || 'NÃO DEFINIDO'}`);
  });

  // 3. Verificar Sincronização
  console.log('\n🔄 Verificando consistência...');
  let hasErrors = false;

  for (const plan of dbPlans) {
    if (!plan.stripeProductId) {
      console.warn(`⚠️  Plano "${plan.name}" não tem Stripe Product ID.`);
      hasErrors = true;
      continue;
    }

    try {
      const stripeProduct = await stripe.products.retrieve(plan.stripeProductId);
      console.log(`✅ Plano "${plan.name}" sincronizado com Produto Stripe "${stripeProduct.name}"`);
    } catch (error) {
      console.error(`❌ Plano "${plan.name}" tem Product ID ${plan.stripeProductId} mas não foi encontrado no Stripe.`);
      hasErrors = true;
    }

    if (plan.stripePriceId) {
      try {
        const stripePrice = await stripe.prices.retrieve(plan.stripePriceId);
        console.log(`✅ Preço do plano "${plan.name}" validado no Stripe (${stripePrice.unit_amount! / 100} ${stripePrice.currency})`);
      } catch (error) {
        console.error(`❌ Plano "${plan.name}" tem Price ID ${plan.stripePriceId} mas não foi encontrado no Stripe.`);
        hasErrors = true;
      }
    } else {
        console.warn(`⚠️  Plano "${plan.name}" não tem Stripe Price ID.`);
    }
  }

  // 4. Verificar Webhook Secret
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('\n✅ STRIPE_WEBHOOK_SECRET está definido.');
  } else {
    console.error('\n❌ STRIPE_WEBHOOK_SECRET não está definido.');
    hasErrors = true;
  }

  if (hasErrors) {
    console.log('\n⚠️  A verificação terminou com avisos ou erros.');
  } else {
    console.log('\n✨ Tudo parece estar configurado corretamente!');
  }
}

verifyStripeIntegration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
