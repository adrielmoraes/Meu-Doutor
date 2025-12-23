'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { changeAdminPassword } from '@/app/admin/settings/actions';

interface SecuritySettingsProps {
  admin: {
    id: string;
    name: string;
    email: string;
  };
}

export function SecuritySettings({ admin }: SecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    setLoading(true);

    try {
      const result = await changeAdminPassword({
        adminId: admin.id,
        currentPassword,
        newPassword,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao alterar senha' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao processar solicitação' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-cyan-400" />
          Segurança
        </CardTitle>
        <CardDescription className="text-white">Configurações de segurança e autenticação</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Admin */}
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Admin Logado</span>
          </div>
          <p className="text-white font-medium">{admin.name}</p>
          <p className="text-gray-400 text-sm">{admin.email}</p>
        </div>

        {/* Alterar Senha */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Key className="h-4 w-4 text-cyan-400" />
            <h3 className="font-medium">Alterar Senha</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-gray-300">
                Senha Atual
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-slate-900/50 border-cyan-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-300">
                Nova Senha
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-900/50 border-cyan-500/30 text-white"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-900/50 border-cyan-500/30 text-white"
                required
                minLength={6}
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg border flex items-start gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </form>
        </div>

        {/* Tempo de Sessão */}
        <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Tempo de Sessão</span>
            </div>
            <span className="text-sm text-cyan-400 font-medium">7 dias</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            As sessões expiram automaticamente após 7 dias de inatividade
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
