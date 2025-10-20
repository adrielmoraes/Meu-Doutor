import { createOrUpdateSubscriptionPlan } from '../src/lib/subscription-adapter';

async function seedPlans() {
  console.log('Criando planos de assinatura...');

  const plans = [
    {
      id: 'basico',
      name: 'Básico',
      description: 'Acesso completo às consultas e análises com IA',
      price: 4900,
      currency: 'brl',
      interval: 'month',
      features: [
        'Consultas ilimitadas com IA',
        'Análise de exames com IA',
        'Chatbot médico 24/7',
        'Plano de bem-estar personalizado',
        'Histórico completo de saúde',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Tudo do Básico + consultas com médicos reais e avatar IA ao vivo',
      price: 9900,
      currency: 'brl',
      interval: 'month',
      features: [
        'Tudo do plano Básico',
        'Consultas por vídeo com médicos reais',
        'Avatar IA ao vivo (Tavus)',
        'Prioridade no agendamento',
        'Acompanhamento personalizado',
        'Relatórios mensais detalhados',
        'Suporte prioritário',
      ],
    },
    {
      id: 'familiar',
      name: 'Familiar',
      description: 'Plano Premium para até 4 membros da família',
      price: 14900,
      currency: 'brl',
      interval: 'month',
      features: [
        'Tudo do plano Premium',
        'Até 4 membros da família',
        'Consultas ilimitadas para todos',
        'Painel familiar completo',
        'Alertas de saúde da família',
        'Desconto de 25%',
      ],
    },
  ];

  for (const plan of plans) {
    await createOrUpdateSubscriptionPlan(plan);
    console.log(`✓ Plano "${plan.name}" criado/atualizado`);
  }

  console.log('\n✅ Planos de assinatura criados com sucesso!');
  console.log('\nPróximos passos:');
  console.log('1. Configure os produtos e preços no Stripe Dashboard');
  console.log('2. Atualize os stripePriceId de cada plano no banco de dados');
  console.log('3. Configure o STRIPE_WEBHOOK_SECRET para processar eventos');
}

seedPlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro ao criar planos:', error);
    process.exit(1);
  });
