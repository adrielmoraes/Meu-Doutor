import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getPatientById } from '@/lib/db-adapter';
import LiveKitConsultation from '@/components/patient/livekit-consultation';
import { canUseResource } from '@/lib/subscription-limits';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function LiveConsultationPage() {
  const session = await getSession();

  if (!session || session.role !== 'patient') {
    redirect('/auth/login');
  }

  const patient = await getPatientById(session.userId);

  if (!patient) {
    redirect('/patient/dashboard');
  }

  // Verificar se o paciente tem minutos disponíveis para consulta com IA
  const quotaCheck = await canUseResource(patient.id, 'aiConsultationMinutes');

  // Se não tem permissão, mostrar aviso de limite atingido
  if (!quotaCheck.allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            {/* Ícone de alerta */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-4 rounded-full">
                <AlertTriangle className="w-16 h-16 text-amber-400" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Limite de Minutos Atingido
            </h1>

            {/* Mensagem */}
            <p className="text-slate-300 text-center text-lg mb-6">
              {quotaCheck.message}
            </p>

            {/* Informações de uso */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300">Minutos usados este mês:</span>
                </div>
                <span className="text-2xl font-bold text-blue-400">{quotaCheck.current}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-300">Limite do plano:</span>
                </div>
                <span className="text-2xl font-bold text-purple-400">
                  {quotaCheck.limit === Infinity ? 'Ilimitado' : quotaCheck.limit}
                </span>
              </div>

              {/* Barra de progresso */}
              {quotaCheck.limit !== Infinity && (
                <div className="mt-4">
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${Math.min((quotaCheck.current / quotaCheck.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    {quotaCheck.current} de {quotaCheck.limit} minutos utilizados
                  </p>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/patient/subscription" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg shadow-lg shadow-blue-500/25">
                  Ver Planos Disponíveis
                </Button>
              </Link>
              <Link href="/patient/dashboard" className="flex-1">
                <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 py-6 text-lg">
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>

            {/* Dica */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300 text-center">
                💡 <strong>Dica:</strong> Upgrade para um plano superior para obter mais minutos de consulta com IA por mês!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se tem permissão, renderizar a consulta normalmente
  // Para planos ilimitados, não calcular availableMinutes como Infinity - current
  const availableMinutes = quotaCheck.limit === Infinity 
    ? Infinity 
    : Math.max(0, quotaCheck.limit - quotaCheck.current);

  return (
    <div className="min-h-screen bg-background">
      <LiveKitConsultation 
        patientId={patient.id} 
        patientName={patient.name} 
        availableMinutes={availableMinutes}
        usedMinutes={quotaCheck.current}
        totalMinutes={quotaCheck.limit}
      />
    </div>
  );
}
