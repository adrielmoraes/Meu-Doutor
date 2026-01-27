'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RotateCcw, FileText, Video, MessageSquare, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updatePatientQuotas } from '@/app/admin/patients/actions';

interface PatientQuotaManagerProps {
  patientId: string;
  customQuotas?: {
    examAnalysis?: number;
    aiConsultationMinutes?: number;
    doctorConsultationMinutes?: number;
    therapistChat?: number;
    trialDurationDays?: number;
  } | null;
  currentPlan?: string;
}

export default function PatientQuotaManager({ patientId, customQuotas, currentPlan = 'trial' }: PatientQuotaManagerProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [quotas, setQuotas] = useState({
    examAnalysis: customQuotas?.examAnalysis ?? null,
    aiConsultationMinutes: customQuotas?.aiConsultationMinutes ?? null,
    doctorConsultationMinutes: customQuotas?.doctorConsultationMinutes ?? null,
    therapistChat: customQuotas?.therapistChat ?? null,
    trialDurationDays: customQuotas?.trialDurationDays ?? null,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updatePatientQuotas(patientId, quotas);
      
      if (result.success) {
        toast({
          title: 'Cotas atualizadas',
          description: 'As cotas personalizadas do paciente foram atualizadas com sucesso.',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar cotas',
        description: error.message || 'Ocorreu um erro ao atualizar as cotas.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setQuotas({
      examAnalysis: null,
      aiConsultationMinutes: null,
      doctorConsultationMinutes: null,
      therapistChat: null,
      trialDurationDays: null,
    });
  };

  const quotaItems = [
    {
      key: 'examAnalysis' as const,
      label: 'Análises de Exames',
      description: 'Quantidade de exames que podem ser analisados por mês',
      icon: <FileText className="h-4 w-4" />,
      color: 'text-green-400',
      placeholder: 'Ex: 50',
    },
    {
      key: 'aiConsultationMinutes' as const,
      label: 'Minutos de Consulta IA',
      description: 'Minutos de consulta com IA em tempo real por mês',
      icon: <Video className="h-4 w-4" />,
      color: 'text-blue-400',
      placeholder: 'Ex: 30',
    },
    {
      key: 'doctorConsultationMinutes' as const,
      label: 'Minutos de Consulta Médica',
      description: 'Minutos de consulta com médico real por mês',
      icon: <Video className="h-4 w-4" />,
      color: 'text-purple-400',
      placeholder: 'Ex: 60',
    },
    {
      key: 'therapistChat' as const,
      label: 'Mensagens de Chat Terapeuta',
      description: 'Quantidade de mensagens no chat terapeuta por mês',
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'text-cyan-400',
      placeholder: 'Ex: 100',
    },
    {
      key: 'trialDurationDays' as const,
      label: 'Duração do Período de Teste',
      description: 'Dias de duração do período de teste gratuito',
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-yellow-400',
      placeholder: 'Ex: 14',
    },
  ];

  const hasChanges = Object.values(quotas).some(value => value !== null);

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              Gerenciar Cotas do Paciente
            </CardTitle>
            <CardDescription className="mt-2 text-slate-300">
              Defina cotas personalizadas para este paciente. Deixe vazio para usar os limites do plano.
            </CardDescription>
          </div>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            Plano: {currentPlan.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          {quotaItems.map((item) => (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={item.color}>{item.icon}</span>
                <Label htmlFor={item.key} className="text-white font-medium">
                  {item.label}
                </Label>
              </div>
              <p className="text-xs text-gray-400 ml-6">{item.description}</p>
              <Input
                id={item.key}
                type="number"
                min="0"
                placeholder={item.placeholder}
                value={quotas[item.key] ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                  setQuotas(prev => ({ ...prev, [item.key]: value }));
                }}
                className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-gray-500 ml-6"
              />
              {quotas[item.key] === null && (
                <p className="text-xs text-gray-500 ml-6 italic">
                  Usando limite do plano
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-700/50">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Cotas
              </>
            )}
          </Button>
          
          <Button
            onClick={handleReset}
            disabled={isSaving || !hasChanges}
            variant="outline"
            className="border-slate-700/50 text-gray-400 hover:bg-slate-800/50 hover:text-white"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Resetar
          </Button>
        </div>

        {hasChanges && (
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-xs text-orange-400">
              ⚠️ As cotas personalizadas terão prioridade sobre os limites do plano de assinatura.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
