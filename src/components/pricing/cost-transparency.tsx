'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Zap, Brain, MessageSquare, Mic } from "lucide-react";
import { calculateServiceCost, formatBRL, usdToBrlCents, USD_TO_BRL } from "@/lib/ai-token-costs";

export function CostTransparency() {
  const examCost = calculateServiceCost('examAnalysis');
  const aiCallCost = calculateServiceCost('aiConsultationPerMinute');
  const chatCost = calculateServiceCost('therapistChatMessage');
  const ttsCost = calculateServiceCost('textToSpeech');

  const services = [
    {
      icon: Brain,
      name: 'Análise de Exame',
      description: '15 especialistas IA analisando seu exame',
      costUSD: examCost,
      costBRL: examCost * USD_TO_BRL,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Mic,
      name: 'Consulta ao Vivo',
      description: 'Consulta em tempo real com IA médica (por minuto)',
      costUSD: aiCallCost,
      costBRL: aiCallCost * USD_TO_BRL,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: MessageSquare,
      name: 'Chat Terapeuta',
      description: 'Mensagem com terapeuta IA (por mensagem)',
      costUSD: chatCost,
      costBRL: chatCost * USD_TO_BRL,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Zap,
      name: 'Síntese de Voz',
      description: 'Conversão de texto para áudio natural',
      costUSD: ttsCost,
      costBRL: ttsCost * USD_TO_BRL,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          <CardTitle>Transparência de Custos</CardTitle>
        </div>
        <CardDescription>
          Custos reais dos modelos de IA que usamos para te atender
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.name}
                className={`rounded-lg border border-gray-800/50 ${service.bgColor} p-4 transition-all hover:scale-105`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg bg-gray-900/50 p-2 ${service.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-sm">{service.name}</h4>
                    <p className="text-xs text-gray-400">{service.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {formatBRL(service.costBRL * 100)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        (${service.costUSD.toFixed(4)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-yellow-500">Por que compartilhamos isso?</p>
              <p className="text-gray-400">
                Acreditamos em transparência total. Os valores acima são os custos reais que pagamos 
                ao Google pelos modelos Gemini de última geração. Nossos planos incluem uma margem 
                justa para cobrir infraestrutura, suporte, desenvolvimento e manutenção da plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Modelo usado (Análises):</span>
            <span className="text-gray-300">Gemini 2.5 Flash</span>
          </div>
          <div className="flex justify-between">
            <span>Modelo usado (Consultas ao Vivo):</span>
            <span className="text-gray-300">Gemini 2.5 Flash Native Audio</span>
          </div>
          <div className="flex justify-between">
            <span>Modelo usado (Chat Terapeuta):</span>
            <span className="text-gray-300">Gemini 2.5 Flash</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa de câmbio (USD/BRL):</span>
            <span className="text-gray-300">R$ {USD_TO_BRL.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlanCostBreakdown({ 
  planName, 
  limits 
}: { 
  planName: string;
  limits: {
    examAnalysis: number | string;
    aiConsultationMinutes: number | string;
    therapistChat: number | string;
  }
}) {
  const examCost = calculateServiceCost('examAnalysis');
  const aiCallCost = calculateServiceCost('aiConsultationPerMinute');
  const chatCost = calculateServiceCost('therapistChatMessage');

  // Calcular custo estimado do plano
  const examLimit = typeof limits.examAnalysis === 'number' ? limits.examAnalysis : 50;
  const aiMinutesLimit = typeof limits.aiConsultationMinutes === 'number' ? limits.aiConsultationMinutes : 30;
  const chatMessagesEstimate = 100; // Estimativa para ilimitado

  const totalCostUSD = 
    (examCost * examLimit) +
    (aiCallCost * aiMinutesLimit) +
    (chatCost * chatMessagesEstimate);
  
  const totalCostBRL = totalCostUSD * USD_TO_BRL;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-300">Custo Estimado - {planName}</h4>
      <div className="space-y-2 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>{examLimit} análises de exame</span>
          <span className="text-gray-300">{formatBRL((examCost * examLimit * USD_TO_BRL) * 100)}</span>
        </div>
        <div className="flex justify-between">
          <span>{aiMinutesLimit} min consultas ao vivo</span>
          <span className="text-gray-300">{formatBRL((aiCallCost * aiMinutesLimit * USD_TO_BRL) * 100)}</span>
        </div>
        <div className="flex justify-between">
          <span>~{chatMessagesEstimate} mensagens terapeuta</span>
          <span className="text-gray-300">{formatBRL((chatCost * chatMessagesEstimate * USD_TO_BRL) * 100)}</span>
        </div>
        <div className="border-t border-gray-800 pt-2 flex justify-between font-semibold">
          <span className="text-gray-300">Custo Total Estimado:</span>
          <span className="text-blue-400">{formatBRL(totalCostBRL * 100)}</span>
        </div>
      </div>
    </div>
  );
}
