'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { updatePaymentSettings, getPaymentSettings } from '@/app/admin/settings/actions';

interface PaymentSettingsProps {
  adminId: string;
}

export function PaymentSettings({ adminId }: PaymentSettingsProps) {
  const [pixEnabled, setPixEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getPaymentSettings();
        setPixEnabled(settings.pixEnabled || false);
      } catch (err) {
        console.error('Erro ao carregar configurações de pagamento:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handlePixToggle = async (enabled: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updatePaymentSettings({
        adminId,
        pixEnabled: enabled,
      });

      if (result.success) {
        setPixEnabled(enabled);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error || 'Erro ao salvar configurações');
        setPixEnabled(!enabled); // Reverter se falhar
      }
    } catch (err) {
      setError('Erro ao processar solicitação');
      console.error('Erro ao salvar configurações:', err);
      setPixEnabled(!enabled);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <CreditCard className="h-5 w-5" />
            Configurações de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <CreditCard className="h-5 w-5" />
          Configurações de Pagamento
        </CardTitle>
        <CardDescription className="text-white">
          Gerencie os métodos de pagamento disponíveis para os usuários
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* PIX Payment Option */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex-1">
            <Label className="text-white font-semibold cursor-pointer">
              PIX - Transferência Instantânea
            </Label>
            <p className="text-sm text-gray-400 mt-1">
              {pixEnabled 
                ? '✅ Ativado - Usuários podem pagar com PIX' 
                : '❌ Desativado - PIX não aparece para usuários'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Requer ativação prévia no Stripe Dashboard (https://dashboard.stripe.com/account/payments/settings)
            </p>
          </div>
          <Switch
            checked={pixEnabled}
            onCheckedChange={handlePixToggle}
            disabled={loading}
            className="ml-4"
          />
        </div>

        {/* Credit Card Info */}
        <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex-1">
            <Label className="text-white font-semibold">
              Cartão de Crédito/Débito
            </Label>
            <p className="text-sm text-gray-400 mt-1">
              ✅ Sempre ativo - Padrão de pagamento
            </p>
          </div>
          <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0" />
        </div>

        {/* Status Messages */}
        {saved && (
          <div className="flex items-center gap-3 p-4 bg-green-900/30 rounded-lg border border-green-700/50">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
            <p className="text-green-400 text-sm font-medium">
              Configurações salvas com sucesso!
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/30 rounded-lg border border-red-700/50">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
          <p className="text-sm text-blue-300">
            💡 <strong>Dica:</strong> Se PIX não aparece como opção, ative-o primeiro no seu Stripe Dashboard antes de ativar aqui.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
