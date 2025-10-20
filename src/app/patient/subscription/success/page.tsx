'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      router.push('/patient/subscription');
    }
  }, [sessionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Card className="max-w-2xl w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/20 p-6">
              <CheckCircle2 className="h-16 w-16 text-green-400" />
            </div>
          </div>
          <CardTitle className="text-3xl text-white">
            Assinatura Ativada com Sucesso!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-300 text-lg">
            Parabéns! Sua assinatura está ativa e você já pode aproveitar todos os benefícios da plataforma MediAI.
          </p>
          
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 space-y-3">
            <p className="text-green-400 font-semibold">O que você pode fazer agora:</p>
            <ul className="text-gray-300 text-sm space-y-2 text-left">
              <li>✓ Realizar consultas ilimitadas com IA</li>
              <li>✓ Analisar seus exames com tecnologia avançada</li>
              <li>✓ Acessar seu chatbot médico 24/7</li>
              <li>✓ Receber planos de bem-estar personalizados</li>
              <li>✓ Consultar médicos reais por vídeo (Plano Premium)</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => router.push('/patient/dashboard')}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              Ir para Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              onClick={() => router.push('/patient/subscription')}
              variant="outline"
              className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-800"
            >
              Ver Detalhes da Assinatura
            </Button>
          </div>

          <p className="text-gray-500 text-xs pt-4">
            Você receberá um email de confirmação com todos os detalhes da sua assinatura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
