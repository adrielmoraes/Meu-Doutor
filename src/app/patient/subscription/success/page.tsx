'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const dynamic = 'force-dynamic';

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      router.push('/patient/subscription');
    }
  }, [sessionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card className="max-w-2xl w-full bg-card/80 border-green-500/30">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/20 p-6">
              <CheckCircle2 className="h-16 w-16 text-green-700 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-3xl text-foreground/60 dark:text-foreground">
            Assinatura Ativada com Sucesso!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <p className="text-foreground/70 dark:text-muted-foreground text-lg">
            Parabéns! Sua assinatura está ativa e você já pode aproveitar todos os benefícios da plataforma MediAI.
          </p>
          
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 space-y-3">
            <p className="text-green-700 dark:text-green-400 font-semibold">O que você pode fazer agora:</p>
            <ul className="text-foreground/70 dark:text-muted-foreground text-sm space-y-2 text-left">
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
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              Ir para Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              onClick={() => router.push('/patient/subscription')}
              variant="outline"
              className="flex-1 border-border text-foreground/60 dark:text-foreground hover:bg-muted"
            >
              Ver Detalhes da Assinatura
            </Button>
          </div>

          <p className="text-foreground/70 dark:text-muted-foreground text-xs pt-4">
            Você receberá um email de confirmação com todos os detalhes da sua assinatura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div>Carregando informações da assinatura...</div>}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
