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
    <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/doctor">
              <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Configurações
              </h1>
              <p className="text-sm text-blue-200/70">Personalize sua experiência na plataforma</p>
            </div>
          </div>
          <MediAILogo className="h-8 w-auto" />
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-300">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription className="text-blue-200/60">
                Configure como você deseja receber alertas e lembretes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Novos agendamentos</Label>
                  <p className="text-sm text-blue-200/60">Receber e-mail quando pacientes agendarem consultas</p>
                </div>
                <Switch
                  checked={settings.notifications.emailNewAppointment}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emailNewAppointment', checked)}
                />
              </div>
              <Separator className="bg-cyan-500/20" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Cancelamentos</Label>
                  <p className="text-sm text-blue-200/60">Notificar quando consultas forem canceladas</p>
                </div>
                <Switch
                  checked={settings.notifications.emailCancellation}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emailCancellation', checked)}
                />
              </div>
              <Separator className="bg-cyan-500/20" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Lembretes de consulta</Label>
                  <p className="text-sm text-blue-200/60">Receber lembrete antes das consultas agendadas</p>
                </div>
                <Switch
                  checked={settings.notifications.emailReminder}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emailReminder', checked)}
                />
              </div>
              <Separator className="bg-cyan-500/20" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-cyan-400" />
                    Notificações push
                  </Label>
                  <p className="text-sm text-blue-200/60">Alertas no navegador em tempo real</p>
                </div>
                <Switch
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('notifications', 'pushNotifications', checked)}
                />
              </div>
              <Separator className="bg-cyan-500/20" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-cyan-400" />
                    Sons de notificação
                  </Label>
                  <p className="text-sm text-blue-200/60">Reproduzir som ao receber notificações</p>
                </div>
                <Switch
                  checked={settings.notifications.soundEnabled}
                  onCheckedChange={(checked) => updateSetting('notifications', 'soundEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <Calendar className="h-5 w-5" />
                Agenda e Horários
              </CardTitle>
              <CardDescription className="text-blue-200/60">
                Defina suas preferências de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Duração padrão da consulta</Label>
                  <Select
                    value={settings.schedule.defaultDuration.toString()}
                    onValueChange={(value) => updateSetting('schedule', 'defaultDuration', parseInt(value))}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Intervalo entre consultas</Label>
                  <Select
                    value={settings.schedule.bufferTime.toString()}
                    onValueChange={(value) => updateSetting('schedule', 'bufferTime', parseInt(value))}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="0">Sem intervalo</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator className="bg-purple-500/20" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    Início do expediente
                  </Label>
                  <Input
                    type="time"
                    value={settings.schedule.workDayStart}
                    onChange={(e) => updateSetting('schedule', 'workDayStart', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    Fim do expediente
                  </Label>
                  <Input
                    type="time"
                    value={settings.schedule.workDayEnd}
                    onChange={(e) => updateSetting('schedule', 'workDayEnd', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
              
              <Separator className="bg-purple-500/20" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Confirmar automaticamente</Label>
                  <p className="text-sm text-blue-200/60">Confirmar agendamentos sem aprovação manual</p>
                </div>
                <Switch
                  checked={settings.schedule.autoConfirm}
                  onCheckedChange={(checked) => updateSetting('schedule', 'autoConfirm', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-300">
                <Video className="h-5 w-5" />
                Consultas por Vídeo
              </CardTitle>
              <CardDescription className="text-blue-200/60">
                Configure opções para teleconsultas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Gravar consultas automaticamente</Label>
                  <p className="text-sm text-blue-200/60">Salvar gravação das videochamadas para revisão</p>
                </div>
                <Switch
                  checked={settings.consultation.autoRecordCalls}
                  onCheckedChange={(checked) => updateSetting('consultation', 'autoRecordCalls', checked)}
                />
              </div>
              <Separator className="bg-green-500/20" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Transcrição automática</Label>
                  <p className="text-sm text-blue-200/60">Gerar transcrição de texto das consultas</p>
                </div>
                <Switch
                  checked={settings.consultation.enableTranscription}
                  onCheckedChange={(checked) => updateSetting('consultation', 'enableTranscription', checked)}
                />
              </div>
              <Separator className="bg-green-500/20" />
              
              <div className="space-y-2">
                <Label className="text-white">Qualidade de vídeo padrão</Label>
                <Select
                  value={settings.consultation.defaultVideoQuality}
                  onValueChange={(value) => updateSetting('consultation', 'defaultVideoQuality', value)}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="low">Baixa (econômico)</SelectItem>
                    <SelectItem value="medium">Média (balanceado)</SelectItem>
                    <SelectItem value="high">Alta (recomendado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-300">
                <Shield className="h-5 w-5" />
                Privacidade
              </CardTitle>
              <CardDescription className="text-blue-200/60">
                Controle a visibilidade de suas informações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white flex items-center gap-2">
                    <Eye className="h-4 w-4 text-amber-400" />
                    Mostrar status online
                  </Label>
                  <p className="text-sm text-blue-200/60">Pacientes podem ver quando você está online</p>
                </div>
                <Switch
                  checked={settings.privacy.showOnlineStatus}
                  onCheckedChange={(checked) => updateSetting('privacy', 'showOnlineStatus', checked)}
                />
              </div>
              <Separator className="bg-amber-500/20" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Mostrar última atividade</Label>
                  <p className="text-sm text-blue-200/60">Exibir quando foi sua última atividade</p>
                </div>
                <Switch
                  checked={settings.privacy.showLastActive}
                  onCheckedChange={(checked) => updateSetting('privacy', 'showLastActive', checked)}
                />
              </div>
              <Separator className="bg-amber-500/20" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-400" />
                    Permitir mensagens de pacientes
                  </Label>
                  <p className="text-sm text-blue-200/60">Receber mensagens diretas de pacientes</p>
                </div>
                <Switch
                  checked={settings.privacy.allowPatientMessages}
                  onCheckedChange={(checked) => updateSetting('privacy', 'allowPatientMessages', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-pink-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-300">
                <Monitor className="h-5 w-5" />
                Aparência
              </CardTitle>
              <CardDescription className="text-blue-200/60">
                Personalize a interface da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-white">Tema</Label>
                <div className="flex gap-2">
                  <Button
                    variant={settings.appearance.theme === 'dark' ? 'default' : 'outline'}
                    className={settings.appearance.theme === 'dark' 
                      ? 'bg-cyan-600 hover:bg-cyan-700' 
                      : 'border-slate-700 text-white hover:bg-slate-800'}
                    onClick={() => updateSetting('appearance', 'theme', 'dark')}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Escuro
                  </Button>
                  <Button
                    variant={settings.appearance.theme === 'light' ? 'default' : 'outline'}
                    className={settings.appearance.theme === 'light' 
                      ? 'bg-cyan-600 hover:bg-cyan-700' 
                      : 'border-slate-700 text-white hover:bg-slate-800'}
                    onClick={() => updateSetting('appearance', 'theme', 'light')}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Claro
                  </Button>
                  <Button
                    variant={settings.appearance.theme === 'system' ? 'default' : 'outline'}
                    className={settings.appearance.theme === 'system' 
                      ? 'bg-cyan-600 hover:bg-cyan-700' 
                      : 'border-slate-700 text-white hover:bg-slate-800'}
                    onClick={() => updateSetting('appearance', 'theme', 'system')}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Sistema
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-300">
                  Alterações não salvas
                </Badge>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
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
