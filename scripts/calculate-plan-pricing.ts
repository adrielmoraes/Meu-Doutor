// Script para calcular preços de planos baseados em custos reais de tokens
// Execute com: npx tsx scripts/calculate-plan-pricing.ts

import { calculatePlanPrice, formatBRL, calculateServiceCost } from '../src/lib/ai-token-costs';

console.log('='.repeat(80));
console.log('📊 ANÁLISE DE CUSTOS POR SERVIÇO (USD)');
console.log('='.repeat(80));
console.log('');

console.log('1️⃣  Análise de Exame (15 especialistas):');
const examCost = calculateServiceCost('examAnalysis');
console.log(`   Custo: $${examCost.toFixed(4)} por análise`);
console.log('');

console.log('2️⃣  Consulta ao Vivo (IA com voz):');
const aiCallCost = calculateServiceCost('aiConsultationPerMinute');
console.log(`   Custo: $${aiCallCost.toFixed(4)} por minuto`);
console.log('');

console.log('3️⃣  Chat Terapeuta:');
const chatCost = calculateServiceCost('therapistChatMessage');
console.log(`   Custo: $${chatCost.toFixed(4)} por mensagem`);
console.log('');

console.log('4️⃣  Text-to-Speech (TTS):');
const ttsCost = calculateServiceCost('textToSpeech');
console.log(`   Custo: $${ttsCost.toFixed(4)} por uso`);
console.log('');

console.log('='.repeat(80));
console.log('💰 CÁLCULO DE PREÇOS DOS PLANOS');
console.log('='.repeat(80));
console.log('');

// PLANO TRIAL (7 dias)
console.log('🔷 PLANO TRIAL (7 dias grátis)');
const trialPricing = calculatePlanPrice(
  {
    examAnalysis: 5,
    aiConsultationMinutes: 5,
    therapistChatMessages: 50, // Estimativa para trial
  },
  1.0 // Sem margem (custo real)
);
console.log(`   Custo Real: ${formatBRL(trialPricing.costBRL * 100)} ($${trialPricing.costUSD.toFixed(2)})`);
console.log(`   Preço Atual: R$ 0,00 (GRÁTIS)`);
console.log(`   💡 Custo absorvido pela plataforma: ${formatBRL(trialPricing.costBRL * 100)}`);
console.log('');

// PLANO BÁSICO
console.log('🔷 PLANO BÁSICO');
const basicPricing = calculatePlanPrice(
  {
    examAnalysis: 20,
    aiConsultationMinutes: 5,
    therapistChatMessages: 100,
  },
  3.0 // Margem de 3x (200% lucro)
);
console.log(`   Custo Real: ${formatBRL(basicPricing.costBRL * 100)} ($${basicPricing.costUSD.toFixed(2)})`);
console.log(`   Preço Sugerido (3x): ${formatBRL(basicPricing.priceBRLCents)} ($${basicPricing.priceUSD.toFixed(2)})`);
console.log(`   Preço Atual: R$ 97,90`);
console.log(`   Margem Atual: ${((9790 / (basicPricing.costBRL * 100)) - 1).toFixed(1)}x`);
console.log('');

// PLANO PREMIUM
console.log('🔷 PLANO PREMIUM');
const premiumPricing = calculatePlanPrice(
  {
    examAnalysis: 50, // Estimativa para "ilimitado" (média de uso)
    aiConsultationMinutes: 30,
    therapistChatMessages: 200,
  },
  2.5 // Margem de 2.5x (150% lucro)
);
console.log(`   Custo Real (estimado): ${formatBRL(premiumPricing.costBRL * 100)} ($${premiumPricing.costUSD.toFixed(2)})`);
console.log(`   Preço Sugerido (2.5x): ${formatBRL(premiumPricing.priceBRLCents)} ($${premiumPricing.priceUSD.toFixed(2)})`);
console.log(`   Preço Atual: R$ 197,90`);
console.log(`   Margem Atual: ${((19790 / (premiumPricing.costBRL * 100)) - 1).toFixed(1)}x`);
console.log('');

// PLANO FAMILIAR
console.log('🔷 PLANO FAMILIAR (estimativa para uso médio)');
const familyPricing = calculatePlanPrice(
  {
    examAnalysis: 100, // Estimativa para "ilimitado"
    aiConsultationMinutes: 60, // Estimativa para "ilimitado"
    therapistChatMessages: 500, // Estimativa para "ilimitado"
  },
  2.0 // Margem de 2x (100% lucro)
);
console.log(`   Custo Real (estimado): ${formatBRL(familyPricing.costBRL * 100)} ($${familyPricing.costUSD.toFixed(2)})`);
console.log(`   Preço Sugerido (2.0x): ${formatBRL(familyPricing.priceBRLCents)} ($${familyPricing.priceUSD.toFixed(2)})`);
console.log(`   💡 Sugestão: Definir limite de uso razoável para controlar custos`);
console.log('');

console.log('='.repeat(80));
console.log('📋 RECOMENDAÇÕES');
console.log('='.repeat(80));
console.log('');
console.log('✅ PREÇOS SUGERIDOS (baseados em custos reais):');
console.log('');
console.log('   🆓 Trial (7 dias):    R$ 0,00       (custo absorvido: ~R$ 0,69)');
console.log(`   💼 Básico:           ${formatBRL(basicPricing.priceBRLCents)}    (margem: 3.0x)`);
console.log(`   ⭐ Premium:          ${formatBRL(premiumPricing.priceBRLCents)}   (margem: 2.5x)`);
console.log(`   👨‍👩‍👧‍👦 Familiar:          ${formatBRL(familyPricing.priceBRLCents)}  (margem: 2.0x, com limites)`);
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('   • Planos "ilimitados" podem gerar custos muito altos');
console.log('   • Considere definir fair usage limits (ex: 50 análises, 60 min consultas)');
console.log('   • Monitore uso médio mensal e ajuste preços conforme necessário');
console.log('   • Taxa de câmbio USD/BRL pode variar - revisar trimestralmente');
console.log('');
console.log('💡 PRÓXIMOS PASSOS:');
console.log('   1. Atualizar preços em src/app/patient/subscription/page.tsx');
console.log('   2. Criar novos produtos/preços no Stripe Dashboard');
console.log('   3. Atualizar variáveis de ambiente com novos STRIPE_PRICE_IDs');
console.log('   4. Comunicar mudanças aos usuários existentes');
console.log('   5. Implementar fair usage limits para planos "ilimitados"');
console.log('');
console.log('='.repeat(80));
