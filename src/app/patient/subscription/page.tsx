'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, CreditCard, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    id: 'trial',
    name: 'Teste Grátis',
    price: 0,
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

  const getCurrentPlanName = () => {
    const planId = subscriptionStatus?.subscription?.planId;
    const plan = plans.find(p => p.id === planId);
    return plan?.name || 'Premium';
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
    const confirmed = confirm(
      '⚠️ Cancelar Assinatura?\n\n' +
      'Sua assinatura será cancelada ao final do período atual.\n' +
      'Você manterá acesso completo até: ' + 
      new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString('pt-BR') + '\n\n' +
      'Deseja continuar?'
    );
    
    if (!confirmed) return;

    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.error) {
        alert('❌ Erro: ' + data.error);
        return;
      }

      alert('✅ ' + data.message);
      fetchSubscriptionStatus();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      alert('❌ Erro ao cancelar assinatura. Tente novamente.');
    }
  };

  const handleResumeSubscription = async () => {
    const confirmed = confirm(
      '✅ Reativar Assinatura?\n\n' +
      'Sua assinatura voltará a renovar automaticamente.\n' +
      'Próxima cobrança: ' + 
      new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString('pt-BR') + '\n\n' +
      'Deseja continuar?'
    );
    
    if (!confirmed) return;

    try {
      const res = await fetch('/api/stripe/resume-subscription', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.error) {
        alert('❌ Erro: ' + data.error);
        return;
      }

      alert('✅ ' + data.message);
      fetchSubscriptionStatus();
    } catch (error) {
      console.error('Erro ao reativar assinatura:', error);
      alert('❌ Erro ao reativar assinatura. Tente novamente.');
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
          <Card className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-500/20 dark:to-emerald-500/20 border-green-500/40 dark:border-green-500/40 shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-2xl">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                Minha Assinatura Atual
              </CardTitle>
              <CardDescription className="text-base">
                Gerencie sua assinatura e veja detalhes do seu plano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plano Atual */}
              <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg border border-green-200 dark:border-green-600/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">Plano Ativo:</span>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1">
                    {getCurrentPlanName()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">Status:</span>
                  <span className={`text-sm font-semibold ${
                    subscriptionStatus.subscription?.cancelAtPeriodEnd 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {subscriptionStatus.subscription?.cancelAtPeriodEnd ? '⚠️ Cancelamento Agendado' : '✓ Ativa'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">
                    {subscriptionStatus.subscription?.cancelAtPeriodEnd ? 'Válida até:' : 'Renovação:'}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Descrição do Status */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-600/30">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {subscriptionStatus.subscription?.cancelAtPeriodEnd ? (
                    <>
                      <span className="font-semibold">Sua assinatura será cancelada</span> em{' '}
                      {new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}.
                      Você ainda terá acesso completo até essa data.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">Renovação automática</span> em{' '}
                      {new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}.
                      Seu cartão será cobrado automaticamente.
                    </>
                  )}
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-2">
                {subscriptionStatus.subscription?.cancelAtPeriodEnd ? (
                  <Button
                    onClick={handleResumeSubscription}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Reativar Assinatura
                  </Button>
                ) : (
                  <Button
                    onClick={handleCancelSubscription}
                    variant="destructive"
                    className="flex-1 shadow-lg"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar Assinatura
                  </Button>
                )}
              </div>
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
                  disabled={loading === plan.id || subscriptionStatus?.hasActiveSubscription}
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
                  ) : subscriptionStatus?.hasActiveSubscription ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Assinado
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
