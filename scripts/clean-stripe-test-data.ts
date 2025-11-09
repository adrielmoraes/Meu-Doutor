
import { db } from '../server/storage';
import { subscriptions, payments } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function cleanStripeTestData() {
  console.log('🧹 Limpando dados de teste do Stripe...');
  
  try {
    // Deletar subscriptions com customer IDs de teste (começam com cus_ seguido de test)
    const deletedSubs = await db
      .delete(subscriptions)
      .where(sql`${subscriptions.stripeCustomerId} LIKE 'cus_%'`)
      .returning();
    
    console.log(`✅ ${deletedSubs.length} assinaturas de teste removidas`);
    
    // Deletar payments relacionados
    const deletedPayments = await db
      .delete(payments)
      .where(sql`${payments.stripePaymentIntentId} LIKE 'pi_test_%' OR ${payments.stripePaymentIntentId} LIKE 'pi_%'`)
      .returning();
    
    console.log(`✅ ${deletedPayments.length} pagamentos de teste removidos`);
    
    console.log('\n✨ Banco de dados limpo! Agora você pode criar novas assinaturas com as chaves live.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    process.exit(1);
  }
}

cleanStripeTestData();
