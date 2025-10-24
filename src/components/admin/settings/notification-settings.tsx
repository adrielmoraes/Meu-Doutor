'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";

export function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    newPatient: true,
    newDoctor: true,
    newExam: true,
    newConsultation: false,
    systemAlerts: true,
    weeklyReport: true,
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // Aqui você pode implementar a lógica para salvar no banco de dados
    console.log('Salvando configurações:', notifications);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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

        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
