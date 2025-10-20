import { createOrUpdateSubscriptionPlan } from '../src/lib/subscription-adapter';

async function seedPlans() {
  console.log('Criando planos de assinatura...');

  const plans = [
    {
      id: 'trial',
      name: 'Teste Grátis',
      description: 'Experimente a plataforma por 7 dias sem custo',
      price: 0,
      currency: 'brl',
      interval: 'month',
      features: [
        'Chat terapeuta ilimitado',
        '5 análises de exames durante o período',
        '5 minutos de consulta com IA em tempo real',
        'Plano de bem-estar personalizado',
        'Histórico completo de saúde',
        'Chatbot médico 24/7',
        'Válido por 7 dias',
      ],
    },
    {
      id: 'basico',
      name: 'Básico',
      description: 'Acesso essencial à plataforma com limites mensais',
      price: 9790,
      currency: 'brl',
      interval: 'month',
      features: [
        'Chat terapeuta ilimitado',
        '20 análises de exames por mês',
        '5 minutos de consulta com IA em tempo real',
        'Plano de bem-estar personalizado',
        'Histórico completo de saúde',
        'Chatbot médico 24/7',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Acesso completo com consultas IA e médicos reais',
      price: 19790,
      currency: 'brl',
      interval: 'month',
      features: [
        'Chat terapeuta ilimitado',
        'Análise de exames ilimitada',
        '30 minutos de consulta com IA em tempo real',
        '30 minutos de consulta com médico real',
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
      description: 'Plano Premium para toda a família',
      price: 29790,
      currency: 'brl',
      interval: 'month',
      features: [
        'Tudo do plano Premium',
        'Até 4 membros da família',
        'Consultas ilimitadas para todos',
        'Painel familiar completo',
        'Alertas de saúde da família',
        'Economia de R$ 49,16 por mês',
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
