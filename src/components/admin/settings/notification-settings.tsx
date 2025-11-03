'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, AlertTriangle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getSettings, updateNotificationSettings } from '@/app/admin/settings/actions';

interface NotificationSettingsProps {
  adminId: string;
}

export function NotificationSettings({ adminId }: NotificationSettingsProps) {
  const [notifications, setNotifications] = useState({
    newPatient: true,
    newDoctor: true,
    newExam: true,
    newConsultation: false,
    systemAlerts: true,
    weeklyReport: true,
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        if (data) {
          setNotifications({
            newPatient: data.notifyNewPatient,
            newDoctor: data.notifyNewDoctor,
            newExam: data.notifyNewExam,
            newConsultation: data.notifyNewConsultation,
            systemAlerts: data.notifySystemAlerts,
            weeklyReport: data.notifyWeeklyReport,
          });
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateNotificationSettings({
        adminId,
        notifyNewPatient: notifications.newPatient,
        notifyNewDoctor: notifications.newDoctor,
        notifyNewExam: notifications.newExam,
        notifyNewConsultation: notifications.newConsultation,
        notifySystemAlerts: notifications.systemAlerts,
        notifyWeeklyReport: notifications.weeklyReport,
      });

      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error || 'Erro ao salvar configurações');
      }
    } catch (err) {
      setError('Erro ao processar solicitação');
      console.error('Erro ao salvar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bell className="h-5 w-5 text-green-400" />
            Notificações
          </CardTitle>
          <CardDescription>Configure alertas e notificações do sistema</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="h-5 w-5 text-green-400" />
          Notificações
        </CardTitle>
        <CardDescription>Configure alertas e notificações do sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Mail className="h-4 w-4 text-green-400" />
            <h3 className="font-medium">Notificações por Email</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/30 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="newPatient" className="text-sm text-white cursor-pointer">
                  Novo Paciente
                </Label>
                <p className="text-xs text-gray-500">
                  Receber email quando um novo paciente se cadastrar
                </p>
              </div>
              <Switch
                id="newPatient"
                checked={notifications.newPatient}
                onCheckedChange={() => handleToggle('newPatient')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/30 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="newDoctor" className="text-sm text-white cursor-pointer">
                  Novo Médico
                </Label>
                <p className="text-xs text-gray-500">
                  Receber email quando um novo médico se cadastrar
                </p>
              </div>
              <Switch
                id="newDoctor"
                checked={notifications.newDoctor}
                onCheckedChange={() => handleToggle('newDoctor')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/30 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="newExam" className="text-sm text-white cursor-pointer">
                  Novo Exame
                </Label>
                <p className="text-xs text-gray-500">
                  Receber email quando um exame for enviado
                </p>
              </div>
              <Switch
                id="newExam"
                checked={notifications.newExam}
                onCheckedChange={() => handleToggle('newExam')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/30 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="newConsultation" className="text-sm text-white cursor-pointer">
                  Nova Consulta
                </Label>
                <p className="text-xs text-gray-500">
                  Receber email para cada nova consulta
                </p>
              </div>
              <Switch
                id="newConsultation"
                checked={notifications.newConsultation}
                onCheckedChange={() => handleToggle('newConsultation')}
              />
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <h3 className="font-medium">Alertas do Sistema</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/30 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="systemAlerts" className="text-sm text-white cursor-pointer">
                  Alertas Críticos
                </Label>
                <p className="text-xs text-gray-500">
                  Erros do sistema, falhas e problemas críticos
                </p>
              </div>
              <Switch
                id="systemAlerts"
                checked={notifications.systemAlerts}
                onCheckedChange={() => handleToggle('systemAlerts')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/30 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="weeklyReport" className="text-sm text-white cursor-pointer">
                  Relatório Semanal
                </Label>
                <p className="text-xs text-gray-500">
                  Resumo semanal com estatísticas da plataforma
                </p>
              </div>
              <Switch
                id="weeklyReport"
                checked={notifications.weeklyReport}
                onCheckedChange={() => handleToggle('weeklyReport')}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        {saved && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Configurações salvas com sucesso!</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
