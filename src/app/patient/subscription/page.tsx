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
              <CardDescription>
                {subscriptionStatus.subscription?.cancelAtPeriodEnd ? (
                  <span className="text-orange-700 dark:text-orange-300">
                    Sua assinatura será cancelada em{' '}
                    {new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  </span>
                ) : (
                  <span className="text-green-700 dark:text-green-300">
                    Renovação automática em{' '}
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
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative bg-white dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl border ${
                plan.popular ? 'border-pink-500 dark:border-cyan-500/60 shadow-lg shadow-pink-500/20 dark:shadow-cyan-500/30' : 'border-gray-300 dark:border-slate-700/60'
              } transition-all hover:scale-105`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 dark:from-cyan-500 dark:to-blue-500 text-white px-4 py-1 shadow-lg">
                    {plan.isTrial ? '🎁 Grátis por 7 dias' : 'Mais Popular'}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center space-y-2 pt-8">
                <CardTitle className="text-2xl text-gray-900 dark:text-white">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                    R$ {(plan.price / 100).toFixed(2)}
                  </span>
                  <span className="text-gray-700 dark:text-slate-300">/{plan.interval}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-pink-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-800 dark:text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id, plan.stripePriceId)}
                  disabled={loading === plan.id || subscriptionStatus?.hasActiveSubscription}
                  className={`w-full text-white ${
                    plan.popular
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 dark:from-cyan-500 dark:to-blue-500 dark:hover:from-cyan-600 dark:hover:to-blue-600'
                      : 'bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 dark:from-slate-700 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-500'
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
          ))}
        </div>

        {/* Footer Info */}
        <Card className="bg-white dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-900/50 border-gray-300 dark:border-slate-700/50">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-gray-700 dark:text-slate-300 text-sm">
              <Calendar className="h-4 w-4 inline mr-2 text-pink-600 dark:text-cyan-400" />
              Cancele a qualquer momento • Sem taxas ocultas • Suporte 24/7
            </p>
            <p className="text-gray-600 dark:text-slate-400 text-xs">
              Pagamentos processados de forma segura pelo Stripe
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
