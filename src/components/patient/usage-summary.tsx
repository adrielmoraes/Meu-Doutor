
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Phone, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export default function UsageSummary() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/check-limit')
      .then(res => res.json())
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar resumo:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !summary) return null;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center justify-between">
          <span>Uso do Plano {summary.planName}</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/patient/subscription')}
          >
            Upgrade
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Análise de Exames */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-pink-600 dark:text-cyan-400" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Análises de Exames</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {summary.examAnalysis.current} / {summary.examAnalysis.limit === Infinity ? '∞' : summary.examAnalysis.limit}
            </span>
          </div>
          {summary.examAnalysis.limit !== Infinity && (
            <>
              <Progress 
                value={summary.examAnalysis.percentage} 
                className={`h-2 ${getProgressColor(summary.examAnalysis.percentage)}`}
              />
              {summary.examAnalysis.percentage >= 90 && (
                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>Limite quase atingido!</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Consultas IA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-pink-600 dark:text-cyan-400" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Consultas IA (minutos)</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {summary.aiConsultation.current} / {summary.aiConsultation.limit === Infinity ? '∞' : summary.aiConsultation.limit}
            </span>
          </div>
          {summary.aiConsultation.limit !== Infinity && (
            <Progress 
              value={summary.aiConsultation.percentage} 
              className={`h-2 ${getProgressColor(summary.aiConsultation.percentage)}`}
            />
          )}
        </div>

        {/* Consultas Médico */}
        {summary.doctorConsultation.limit > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-pink-600 dark:text-cyan-400" />
                <span className="text-sm text-gray-700 dark:text-slate-300">Consultas Médico (minutos)</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {summary.doctorConsultation.current} / {summary.doctorConsultation.limit === Infinity ? '∞' : summary.doctorConsultation.limit}
              </span>
            </div>
            {summary.doctorConsultation.limit !== Infinity && (
              <Progress 
                value={summary.doctorConsultation.percentage} 
                className={`h-2 ${getProgressColor(summary.doctorConsultation.percentage)}`}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
