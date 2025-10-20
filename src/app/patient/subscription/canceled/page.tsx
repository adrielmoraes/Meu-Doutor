'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function SubscriptionCanceledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Card className="max-w-2xl w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-orange-500/20 p-6">
              <XCircle className="h-16 w-16 text-orange-400" />
            </div>
          </div>
          <CardTitle className="text-3xl text-white">
            Assinatura Cancelada
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-300 text-lg">
            O processo de assinatura foi cancelado. Nenhuma cobrança foi realizada.
          </p>
          
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6 space-y-3">
            <p className="text-orange-400 font-semibold">Que pena que você desistiu!</p>
            <p className="text-gray-300 text-sm">
              Com a assinatura MediAI você teria acesso a:
            </p>
            <ul className="text-gray-300 text-sm space-y-2 text-left">
              <li>✓ Consultas ilimitadas com IA médica avançada</li>
              <li>✓ Análise inteligente de exames</li>
              <li>✓ Chatbot médico disponível 24/7</li>
              <li>✓ Planos de bem-estar personalizados</li>
              <li>✓ Suporte prioritário</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => router.push('/patient/subscription')}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button
              onClick={() => router.push('/patient')}
              variant="outline"
              className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>

          <p className="text-gray-500 text-xs pt-4">
            Tem dúvidas? Entre em contato com nosso suporte!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
