'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Globe, Palette, Info, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getSettings, updateGeneralSettings } from '@/app/admin/settings/actions';

interface GeneralSettingsProps {
  adminId: string;
}

export function GeneralSettings({ adminId }: GeneralSettingsProps) {
  const [settings, setSettings] = useState({
    platformName: 'MediAI',
    platformDescription: 'Plataforma de saúde com IA',
    supportEmail: 'suporte@mediai.com',
    maxFileSize: '10',
    sessionTimeout: '7',
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
          setSettings({
            platformName: data.platformName,
            platformDescription: data.platformDescription,
            supportEmail: data.supportEmail,
            maxFileSize: String(data.maxFileSize),
            sessionTimeout: String(data.sessionTimeout),
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

  const handleChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateGeneralSettings({
        adminId,
        platformName: settings.platformName,
        platformDescription: settings.platformDescription,
        supportEmail: settings.supportEmail,
        maxFileSize: parseInt(settings.maxFileSize),
        sessionTimeout: parseInt(settings.sessionTimeout),
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
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5 text-orange-400" />
            Geral
          </CardTitle>
          <CardDescription className="text-white">Configurações gerais da plataforma</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Settings className="h-5 w-5 text-orange-400" />
          Geral
        </CardTitle>
        <CardDescription className="text-white">Configurações gerais da plataforma</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Globe className="h-4 w-4 text-orange-400" />
            <h3 className="font-medium">Informações da Plataforma</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platformName" className="text-gray-300">
                Nome da Plataforma
              </Label>
              <Input
                id="platformName"
                value={settings.platformName}
                onChange={(e) => handleChange('platformName', e.target.value)}
                className="bg-slate-900/50 border-orange-500/30 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platformDescription" className="text-gray-300">
                Descrição
              </Label>
              <Textarea
                id="platformDescription"
                value={settings.platformDescription}
                onChange={(e) => handleChange('platformDescription', e.target.value)}
                className="bg-slate-900/50 border-orange-500/30 text-white resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportEmail" className="text-gray-300">
                Email de Suporte
              </Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                className="bg-slate-900/50 border-orange-500/30 text-white"
              />
            </div>
          </div>
        </div>

        {/* System Limits */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Info className="h-4 w-4 text-orange-400" />
            <h3 className="font-medium">Limites do Sistema</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxFileSize" className="text-gray-300">
                Tamanho Máx. Arquivo (MB)
              </Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleChange('maxFileSize', e.target.value)}
                className="bg-slate-900/50 border-orange-500/30 text-white"
                min="1"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-gray-300">
                Timeout Sessão (dias)
              </Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                className="bg-slate-900/50 border-orange-500/30 text-white"
                min="1"
                max="30"
              />
            </div>
          </div>
        </div>

        {/* Theme Info */}
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Palette className="h-4 w-4" />
            <span className="text-sm font-medium">Tema da Plataforma</span>
          </div>
          <p className="text-xs text-gray-400">
            Tema futurista dark com gradientes cyan, blue e purple
          </p>
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
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
