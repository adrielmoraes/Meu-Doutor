
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPatients } from "@/lib/db-adapter";
import { getSubscriptionByPatientId } from "@/lib/subscription-adapter";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Users, TrendingUp, AlertCircle, Calendar, DollarSign } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/subscription-limits";

function getPlanName(planId: string): string {
  const names: Record<string, string> = {
    trial: 'Teste Grátis',
    basico: 'Básico',
    premium: 'Premium',
    familiar: 'Familiar',
  };
  return names[planId] || planId;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('pt-BR');
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/20',
    trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    canceled: 'bg-red-500/20 text-red-400 border-red-500/20',
    past_due: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
    incomplete: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/20';
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: 'Ativa',
    trialing: 'Trial',
    canceled: 'Cancelada',
    past_due: 'Pagamento Atrasado',
    incomplete: 'Incompleta',
  };
  return labels[status] || status;
}

export default async function AdminSubscriptionsPage() {
  const patients = await getPatients();
  
  // Buscar assinaturas de todos os pacientes
  const subscriptionsData = await Promise.all(
    patients.map(async (patient) => {
      const subscription = await getSubscriptionByPatientId(patient.id);
      return {
        patient,
        subscription,
      };
    })
  );

  // Estatísticas
  const stats = {
    total: subscriptionsData.filter(d => d.subscription).length,
    active: subscriptionsData.filter(d => d.subscription?.status === 'active').length,
    trial: subscriptionsData.filter(d => d.subscription?.status === 'trialing').length,
    canceled: subscriptionsData.filter(d => d.subscription?.status === 'canceled').length,
    pastDue: subscriptionsData.filter(d => d.subscription?.status === 'past_due').length,
    noSubscription: subscriptionsData.filter(d => !d.subscription).length,
  };

  // Calcular receita mensal estimada (considerando apenas assinaturas ativas)
  const monthlyRevenue = subscriptionsData
    .filter(d => d.subscription?.status === 'active')
    .reduce((acc, d) => {
      const planId = d.subscription?.planId || '';
      const prices: Record<string, number> = {
        basico: 9790, // R$ 97,90 em centavos
        premium: 19790, // R$ 197,90
        familiar: 29790, // R$ 297,90
      };
      return acc + (prices[planId] || 0);
    }, 0);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Gerenciar Assinaturas
        </h1>
        <p className="text-gray-400 mt-2">
          Visualize e gerencie todas as assinaturas da plataforma
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total de Assinaturas</CardTitle>
            <CreditCard className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.noSubscription} sem assinatura
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Assinaturas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.active}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.trial} em trial
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {(monthlyRevenue / 100).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Estimativa mensal
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Atenção Necessária</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pastDue + stats.canceled}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.pastDue} atrasadas, {stats.canceled} canceladas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-400">Assinaturas Detalhadas</CardTitle>
          <CardDescription className="text-gray-400">
            Lista completa de todas as assinaturas por paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subscriptionsData.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma assinatura encontrada
              </div>
            ) : (
              subscriptionsData.map(({ patient, subscription }) => (
                <div
                  key={patient.id}
                  className="p-4 rounded-lg bg-slate-900/50 border border-cyan-500/10 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{patient.name}</h3>
                      <p className="text-sm text-gray-400">{patient.email}</p>
                    </div>
                    {subscription ? (
                      <Badge className={getStatusColor(subscription.status)}>
                        {getStatusLabel(subscription.status)}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">
                        Sem Assinatura
                      </Badge>
                    )}
                  </div>

                  {subscription ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-400">Plano</p>
                        <p className="text-sm font-medium text-white">
                          {getPlanName(subscription.planId)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Início do Período</p>
                        <p className="text-sm font-medium text-white">
                          {formatDate(subscription.currentPeriodStart)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Fim do Período</p>
                        <p className="text-sm font-medium text-white">
                          {formatDate(subscription.currentPeriodEnd)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Stripe ID</p>
                        <p className="text-xs font-mono text-gray-500 truncate">
                          {subscription.stripeSubscriptionId ? `${subscription.stripeSubscriptionId.substring(0, 20)}...` : '—'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-slate-950/50 rounded border border-yellow-500/20">
                      <p className="text-sm text-yellow-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Paciente sem assinatura ativa. Trial não foi ativado automaticamente.
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
