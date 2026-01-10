'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Bell, Calendar, Shield, Clock, Video,
  Mail, Smartphone, Volume2, Eye, Lock, Save, Loader2,
  Moon, Sun, Monitor
} from "lucide-react";
import Link from "next/link";
import MediAILogo from "@/components/layout/mediai-logo";

interface DoctorSettings {
  notifications: {
    emailNewAppointment: boolean;
    emailCancellation: boolean;
    emailReminder: boolean;
    pushNotifications: boolean;
    smsAlerts: boolean;
    soundEnabled: boolean;
  };
  schedule: {
    defaultDuration: number;
    bufferTime: number;
    workDayStart: string;
    workDayEnd: string;
    autoConfirm: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLastActive: boolean;
    allowPatientMessages: boolean;
  };
  consultation: {
    autoRecordCalls: boolean;
    enableTranscription: boolean;
    defaultVideoQuality: string;
  };
  appearance: {
    theme: string;
  };
}

const defaultSettings: DoctorSettings = {
  notifications: {
    emailNewAppointment: true,
    emailCancellation: true,
    emailReminder: true,
    pushNotifications: true,
    smsAlerts: false,
    soundEnabled: true,
  },
  schedule: {
    defaultDuration: 30,
    bufferTime: 10,
    workDayStart: '08:00',
    workDayEnd: '18:00',
    autoConfirm: false,
  },
  privacy: {
    showOnlineStatus: true,
    showLastActive: true,
    allowPatientMessages: true,
  },
  consultation: {
    autoRecordCalls: true,
    enableTranscription: true,
    defaultVideoQuality: 'high',
  },
  appearance: {
    theme: 'dark',
  },
};

export default function DoctorSettingsPage() {
  const [settings, setSettings] = useState<DoctorSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedSettings = localStorage.getItem('doctorSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  const updateSetting = <K extends keyof DoctorSettings>(
    category: K,
    key: keyof DoctorSettings[K],
    value: DoctorSettings[K][keyof DoctorSettings[K]]
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('doctorSettings', JSON.stringify(settings));
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen relative font-sans text-slate-900">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-60"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/doctor">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Configurações
              </h1>
              <p className="text-sm text-slate-500 font-medium">Personalize sua experiência na plataforma Dr.IA</p>
            </div>
          </div>
          <MediAILogo className="h-8 w-auto opacity-80" />
        </div>

        <div className="space-y-6">
          <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900 font-extrabold">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                Notificações
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Configure como você deseja receber alertas e lembretes
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold">Novos agendamentos</Label>
                  <p className="text-sm text-slate-500">Receber e-mail quando pacientes agendarem consultas</p>
                </div>
                <Switch
                  checked={settings.notifications.emailNewAppointment}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emailNewAppointment', checked)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <Separator className="bg-slate-50" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold">Cancelamentos</Label>
                  <p className="text-sm text-slate-500">Notificar quando consultas forem canceladas</p>
                </div>
                <Switch
                  checked={settings.notifications.emailCancellation}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emailCancellation', checked)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <Separator className="bg-slate-50" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold">Lembretes de consulta</Label>
                  <p className="text-sm text-slate-500">Receber lembrete antes das consultas agendadas</p>
                </div>
                <Switch
                  checked={settings.notifications.emailReminder}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emailReminder', checked)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <Separator className="bg-slate-50" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-500" />
                    Notificações push
                  </Label>
                  <p className="text-sm text-slate-500">Alertas no navegador em tempo real</p>
                </div>
                <Switch
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('notifications', 'pushNotifications', checked)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <Separator className="bg-slate-50" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-blue-500" />
                    Sons de notificação
                  </Label>
                  <p className="text-sm text-slate-500">Reproduzir som ao receber notificações</p>
                </div>
                <Switch
                  checked={settings.notifications.soundEnabled}
                  onCheckedChange={(checked) => updateSetting('notifications', 'soundEnabled', checked)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900 font-extrabold">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                </div>
                Agenda e Horários
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Defina suas preferências de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-800 font-bold">Duração padrão da consulta</Label>
                  <Select
                    value={settings.schedule.defaultDuration.toString()}
                    onValueChange={(value) => updateSetting('schedule', 'defaultDuration', parseInt(value))}
                  >
                    <SelectTrigger className="bg-white border-slate-200 text-slate-900 font-medium h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900 font-medium">
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-800 font-bold">Intervalo entre consultas</Label>
                  <Select
                    value={settings.schedule.bufferTime.toString()}
                    onValueChange={(value) => updateSetting('schedule', 'bufferTime', parseInt(value))}
                  >
                    <SelectTrigger className="bg-white border-slate-200 text-slate-900 font-medium h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900 font-medium">
                      <SelectItem value="0">Sem intervalo</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-slate-50" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-800 font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    Início do expediente
                  </Label>
                  <Input
                    type="time"
                    value={settings.schedule.workDayStart}
                    onChange={(e) => updateSetting('schedule', 'workDayStart', e.target.value)}
                    className="bg-white border-slate-200 text-slate-900 font-medium h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-800 font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    Fim do expediente
                  </Label>
                  <Input
                    type="time"
                    value={settings.schedule.workDayEnd}
                    onChange={(e) => updateSetting('schedule', 'workDayEnd', e.target.value)}
                    className="bg-white border-slate-200 text-slate-900 font-medium h-11"
                  />
                </div>
              </div>

              <Separator className="bg-slate-50" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold">Confirmar automaticamente</Label>
                  <p className="text-sm text-slate-500">Confirmar agendamentos sem aprovação manual</p>
                </div>
                <Switch
                  checked={settings.schedule.autoConfirm}
                  onCheckedChange={(checked) => updateSetting('schedule', 'autoConfirm', checked)}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900 font-extrabold">
                <div className="bg-rose-100 p-2 rounded-lg">
                  <Video className="h-5 w-5 text-rose-600" />
                </div>
                Consultas por Vídeo
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Configure opções para teleconsultas
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold">Gravar consultas automaticamente</Label>
                  <p className="text-sm text-slate-500">Salvar gravação das videochamadas para revisão</p>
                </div>
                <Switch
                  checked={settings.consultation.autoRecordCalls}
                  onCheckedChange={(checked) => updateSetting('consultation', 'autoRecordCalls', checked)}
                  className="data-[state=checked]:bg-rose-600"
                />
              </div>
              <Separator className="bg-slate-50" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold">Transcrição automática</Label>
                  <p className="text-sm text-slate-500">Gerar transcrição de texto das consultas</p>
                </div>
                <Switch
                  checked={settings.consultation.enableTranscription}
                  onCheckedChange={(checked) => updateSetting('consultation', 'enableTranscription', checked)}
                  className="data-[state=checked]:bg-rose-600"
                />
              </div>
              <Separator className="bg-slate-50" />

              <div className="space-y-2">
                <Label className="text-slate-800 font-bold">Qualidade de vídeo padrão</Label>
                <Select
                  value={settings.consultation.defaultVideoQuality}
                  onValueChange={(value) => updateSetting('consultation', 'defaultVideoQuality', value)}
                >
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 font-medium h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 font-medium">
                    <SelectItem value="low">Baixa (econômico)</SelectItem>
                    <SelectItem value="medium">Média (balanceado)</SelectItem>
                    <SelectItem value="high">Alta (recomendado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900 font-extrabold">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                Privacidade
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Controle a visibilidade de suas informações
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-amber-500" />
                    Mostrar status online
                  </Label>
                  <p className="text-sm text-slate-500">Pacientes podem ver quando você está online</p>
                </div>
                <Switch
                  checked={settings.privacy.showOnlineStatus}
                  onCheckedChange={(checked) => updateSetting('privacy', 'showOnlineStatus', checked)}
                  className="data-[state=checked]:bg-amber-600"
                />
              </div>
              <Separator className="bg-slate-50" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold">Mostrar última atividade</Label>
                  <p className="text-sm text-slate-500">Exibir quando foi sua última atividade</p>
                </div>
                <Switch
                  checked={settings.privacy.showLastActive}
                  onCheckedChange={(checked) => updateSetting('privacy', 'showLastActive', checked)}
                  className="data-[state=checked]:bg-amber-600"
                />
              </div>
              <Separator className="bg-slate-50" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-bold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-500" />
                    Permitir mensagens de pacientes
                  </Label>
                  <p className="text-sm text-slate-500">Receber mensagens diretas de pacientes</p>
                </div>
                <Switch
                  checked={settings.privacy.allowPatientMessages}
                  onCheckedChange={(checked) => updateSetting('privacy', 'allowPatientMessages', checked)}
                  className="data-[state=checked]:bg-amber-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900 font-extrabold">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Monitor className="h-5 w-5 text-white" />
                </div>
                Aparência
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Personalize a interface da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-2">
                <Label className="text-slate-800 font-bold">Tema Principal</Label>
                <div className="flex gap-2">
                  <Button
                    variant={settings.appearance.theme === 'dark' ? 'default' : 'outline'}
                    className={settings.appearance.theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                    onClick={() => updateSetting('appearance', 'theme', 'dark')}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Escuro
                  </Button>
                  <Button
                    variant={settings.appearance.theme === 'light' ? 'default' : 'outline'}
                    className={settings.appearance.theme === 'light'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                    onClick={() => updateSetting('appearance', 'theme', 'light')}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Claro (Recomendado)
                  </Button>
                  <Button
                    variant={settings.appearance.theme === 'system' ? 'default' : 'outline'}
                    className={settings.appearance.theme === 'system'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                    onClick={() => updateSetting('appearance', 'theme', 'system')}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Sistema
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-800 font-bold shadow-sm animate-pulse">
                  Alterações não salvas
                </Badge>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-10 py-6 h-auto shadow-lg shadow-blue-100 rounded-xl transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-3" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
