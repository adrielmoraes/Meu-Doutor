
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Phone, MessageSquare, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

interface UsageSummaryData {
  planId: string;
  planName: string;
  examAnalysis: {
    current: number;
    limit: number | typeof Infinity;
    percentage: number;
  };
  aiConsultation: {
    current: number;
    limit: number | typeof Infinity;
    percentage: number;
  };
  doctorConsultation: {
    current: number;
    limit: number | typeof Infinity;
    percentage: number;
  };
}

export default function UsageSummary() {
  const [summary, setSummary] = useState<UsageSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/check-limit')
      .then(res => res.json())
      .then(data => {
        console.log('Usage data:', data);
        setSummary(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar resumo:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-pink-600 dark:text-cyan-400" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const formatLimit = (limit: number | typeof Infinity) => {
    return limit === Infinity ? '∞' : limit.toString();
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
            className="border-pink-600 dark:border-cyan-400 text-pink-600 dark:text-cyan-400 hover:bg-pink-50 dark:hover:bg-slate-700"
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
              {summary.examAnalysis.current} / {formatLimit(summary.examAnalysis.limit)}
            </span>
          </div>
          {summary.examAnalysis.limit !== Infinity && (
            <>
              <Progress 
                value={Math.min(summary.examAnalysis.percentage, 100)} 
                className="h-2"
              />
              <div className={`h-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden`}>
                <div 
                  className={`h-full ${getProgressColor(summary.examAnalysis.percentage)} transition-all duration-300`}
                  style={{ width: `${Math.min(summary.examAnalysis.percentage, 100)}%` }}
                />
              </div>
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
              {summary.aiConsultation.current} / {formatLimit(summary.aiConsultation.limit)}
            </span>
          </div>
          {summary.aiConsultation.limit !== Infinity && (
            <div className={`h-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden`}>
              <div 
                className={`h-full ${getProgressColor(summary.aiConsultation.percentage)} transition-all duration-300`}
                style={{ width: `${Math.min(summary.aiConsultation.percentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Consultas Médico */}
        {summary.doctorConsultation && summary.doctorConsultation.limit > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-pink-600 dark:text-cyan-400" />
                <span className="text-sm text-gray-700 dark:text-slate-300">Consultas Médico (minutos)</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {summary.doctorConsultation.current} / {formatLimit(summary.doctorConsultation.limit)}
              </span>
            </div>
            {summary.doctorConsultation.limit !== Infinity && (
              <div className={`h-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden`}>
                <div 
                  className={`h-full ${getProgressColor(summary.doctorConsultation.percentage)} transition-all duration-300`}
                  style={{ width: `${Math.min(summary.doctorConsultation.percentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
