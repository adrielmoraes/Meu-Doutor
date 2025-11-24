'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, CreditCard, Calendar, X, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CostTransparency } from "@/components/pricing/cost-transparency";

const plans = [
  {
    id: 'trial',
    name: 'Teste Grátis',
    price: 0,
    realCost: 232, // R$ 2,32 (custo real absorvido)
    interval: '7 dias',
    description: 'Experimente a plataforma sem compromisso',
    features: [
      'Chat terapeuta ilimitado',
      '5 análises de exames',
      'Consulta com IA em tempo real',
      'Sem acesso a médico real',
      'Plano de bem-estar personalizado',
      'Histórico completo de saúde',
      'Chatbot médico 24/7',
      'Sem cartão de crédito necessário',
    ],
    limits: {
      examAnalysis: 5,
      aiConsultationMinutes: 5,
      doctorConsultationMinutes: 0,
      therapistChat: 'ilimitado',
      durationDays: 7,
    },
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_TRIAL_PRICE_ID || '',
    popular: true,
    isTrial: true,
  },
  {
    id: 'basico',
    name: 'Básico',
    price: 9790,
    realCost: 482, // R$ 4,82 (custo real de IA)
    interval: 'mês',
    description: 'Acesso essencial à plataforma com limites mensais',
    features: [
      'Chat terapeuta ilimitado',
      '20 análises de exames por mês',
      'Consulta com IA em tempo real',
      'Plano de bem-estar personalizado',
      'Histórico completo de saúde',
      'Chatbot médico 24/7',
    ],
    limits: {
      examAnalysis: 20,
      aiConsultationMinutes: 5,
      doctorConsultationMinutes: 0,
      therapistChat: 'ilimitado',
    },
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || '',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19790,
    realCost: 1517, // R$ 15,17 (custo real de IA + estimativa médico)
    interval: 'mês',
    description: 'Acesso completo com consultas IA e médicos reais',
    features: [
      'Chat terapeuta ilimitado',
      'Análise de exames ilimitada',
      'Consulta com IA em tempo real',
      '30 minutos de consulta com médico real',
      'Prioridade no agendamento',
      'Acompanhamento personalizado',
      'Relatórios mensais detalhados',
      'Suporte prioritário',
    ],
    limits: {
      examAnalysis: 'ilimitado',
      aiConsultationMinutes: 30,
      doctorConsultationMinutes: 30,
      therapistChat: 'ilimitado',
    },
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
    popular: false,
  },
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await fetch('/api/subscription/status');
      const data = await res.json();
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Erro ao carregar status da assinatura:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSubscribe = async (planId: string, stripePriceId: string) => {
    setLoading(planId);
    
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stripePriceId: stripePriceId 
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      // Para trial, redirectUrl é retornado diretamente
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
      // Para planos pagos, url do checkout é retornado
      else if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você ainda terá acesso até o final do período atual.')) {
      return;
    }

    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      alert(data.message);
      fetchSubscriptionStatus();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      alert('Erro ao cancelar assinatura. Tente novamente.');
    }
  };

  const handleResumeSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/resume-subscription', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      alert(data.message);
      fetchSubscriptionStatus();
    } catch (error) {
      console.error('Erro ao reativar assinatura:', error);
      alert('Erro ao reativar assinatura. Tente novamente.');
    }
  };

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-pink-50 via-pink-100 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
            Escolha Seu Plano
          </h1>
          <p className="text-gray-800 dark:text-slate-300 text-lg max-w-2xl mx-auto">
            Tenha acesso completo à melhor plataforma de saúde com IA do Brasil
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscriptionStatus?.hasActiveSubscription && (
          <Card className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-500/20 dark:to-emerald-500/20 border-green-500/40 dark:border-green-500/40">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                Assinatura Ativa
              </CardTitle>
              <CardDescription className="space-y-2">
                {subscriptionStatus.subscription?.planName && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 text-white dark:text-gray-900 text-base px-4 py-1">
                      Plano Atual: {subscriptionStatus.subscription.planName}
                    </Badge>
                  </div>
                )}
                {subscriptionStatus.subscription?.cancelAtPeriodEnd ? (
                  <span className="text-orange-700 dark:text-orange-300 block mt-2">
                    ⚠️ Sua assinatura será cancelada em{' '}
                    {new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  </span>
                ) : (
                  <span className="text-green-700 dark:text-green-300 block mt-2">
                    ✅ Renovação automática em{' '}
                    {new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              {subscriptionStatus.subscription?.cancelAtPeriodEnd ? (
                <Button
                  onClick={handleResumeSubscription}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Reativar Assinatura
                </Button>
              ) : (
                <Button
                  onClick={handleCancelSubscription}
                  variant="destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar Assinatura
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            // Definir cores específicas para cada plano no tema escuro
            const darkCardColors = {
              trial: 'dark:from-cyan-950/80 dark:to-blue-950/80 dark:border-cyan-500/70 dark:shadow-cyan-500/30',
              basico: 'dark:from-green-950/80 dark:to-emerald-950/80 dark:border-green-500/70 dark:shadow-green-500/30',
              premium: 'dark:from-purple-950/80 dark:to-pink-950/80 dark:border-purple-500/70 dark:shadow-purple-500/30'
            };
            
            const cardColor = darkCardColors[plan.id as keyof typeof darkCardColors] || 'dark:from-slate-800/90 dark:to-slate-900/90 dark:border-slate-600/70';
            
            return (
            <Card
              key={plan.id}
              className={`relative bg-white dark:bg-gradient-to-br backdrop-blur-xl border ${cardColor} ${
                plan.popular ? 'border-pink-500 shadow-lg shadow-pink-500/20 dark:border-cyan-500 dark:shadow-cyan-500/30' : 'border-gray-300 dark:border-slate-600'
              } transition-all hover:scale-105`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className={`bg-gradient-to-r text-white px-4 py-1 shadow-lg ${
                    plan.id === 'trial' 
                      ? 'from-pink-500 to-purple-500 dark:from-cyan-400 dark:to-blue-400 dark:shadow-cyan-400/50'
                      : 'from-pink-500 to-purple-500 dark:from-purple-400 dark:to-pink-400 dark:shadow-purple-400/50'
                  }`}>
                    {plan.isTrial ? '🎁 Grátis por 7 dias' : 'Mais Popular'}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center space-y-2 pt-8">
                <CardTitle className="text-2xl text-gray-900 dark:text-white font-bold">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-5xl font-bold ${
                    plan.id === 'trial' 
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 dark:from-cyan-400 dark:to-blue-400'
                      : plan.id === 'basico'
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 dark:from-green-400 dark:to-emerald-400'
                      : 'bg-gradient-to-r from-pink-600 to-purple-600 dark:from-purple-400 dark:to-pink-400'
                  } bg-clip-text text-transparent`}>
                    R$ {(plan.price / 100).toFixed(2)}
                  </span>
                  <span className="text-gray-700 dark:text-slate-100 font-medium">/{plan.interval}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        plan.id === 'trial'
                          ? 'text-pink-600 dark:text-cyan-400'
                          : plan.id === 'basico'
                          ? 'text-pink-600 dark:text-green-400'
                          : 'text-pink-600 dark:text-purple-400'
                      }`} />
                      <span className="text-gray-800 dark:text-slate-100 text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id, plan.stripePriceId)}
                  disabled={
                    loading === plan.id || 
                    (subscriptionStatus?.subscription?.planId === plan.id && subscriptionStatus?.hasActiveSubscription)
                  }
                  className={`w-full text-white ${
                    plan.id === 'trial'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 dark:from-cyan-500 dark:to-blue-500 dark:hover:from-cyan-600 dark:hover:to-blue-600'
                      : plan.id === 'basico'
                      ? 'bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600'
                      : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600'
                  }`}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : subscriptionStatus?.subscription?.planId === plan.id && subscriptionStatus?.hasActiveSubscription ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Plano Atual
                    </>
                  ) : subscriptionStatus?.hasActiveSubscription ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Migrar para este Plano
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Assinar Agora
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Cost Transparency Section */}
        <div className="max-w-4xl mx-auto">
          <CostTransparency />
        </div>

        {/* Value Breakdown */}
        <Card className="bg-white dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 border-gray-300 dark:border-slate-600/70">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Por Que Nossos Preços São Justos?
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-slate-300">
              Entenda o valor real que você recebe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <div className="text-3xl font-bold text-blue-500 mb-2">
                  {plans.find(p => p.id === 'basico')?.realCost ? 
                    `R$ ${(plans.find(p => p.id === 'basico')!.realCost / 100).toFixed(2)}` : 
                    'N/A'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Custo Real IA (Básico)</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">20 análises + 5 min consultas</div>
              </div>
              <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
                <div className="text-3xl font-bold text-purple-500 mb-2">
                  {plans.find(p => p.id === 'premium')?.realCost ? 
                    `R$ ${(plans.find(p => p.id === 'premium')!.realCost / 100).toFixed(2)}` : 
                    'N/A'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Custo Real IA (Premium)</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">50 análises + 30 min consultas</div>
              </div>
              <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  19.3x
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Margem Plano Básico</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Cobre infraestrutura + equipe</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>
                  <strong>Infraestrutura de ponta:</strong> Servidores LiveKit, armazenamento seguro, 
                  CDN global para baixa latência
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>
                  <strong>Desenvolvimento contínuo:</strong> Equipe dedicada melhorando a plataforma 24/7
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>
                  <strong>Suporte especializado:</strong> Atendimento humano para dúvidas e problemas
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span>
                  <strong>Conformidade LGPD:</strong> Segurança e privacidade dos seus dados médicos
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="bg-white dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 border-gray-300 dark:border-slate-600/70">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-gray-700 dark:text-slate-200 text-sm">
              <Calendar className="h-4 w-4 inline mr-2 text-pink-600 dark:text-cyan-300" />
              Cancele a qualquer momento • Sem taxas ocultas • Suporte 24/7
            </p>
            <p className="text-gray-600 dark:text-slate-300 text-xs">
              Pagamentos processados de forma segura pelo Stripe
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
