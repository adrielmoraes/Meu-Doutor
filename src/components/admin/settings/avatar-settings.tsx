'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, CheckCircle2, Info } from 'lucide-react';
import { getSettings, updateAvatarSettings } from '@/app/admin/settings/actions';

interface AvatarSettingsProps {
  adminId: string;
}

export function AvatarSettings({ adminId }: AvatarSettingsProps) {
  const [avatarProvider, setAvatarProvider] = useState<'tavus' | 'bey'>('tavus');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        if (data && data.avatarProvider) {
          setAvatarProvider(data.avatarProvider as 'tavus' | 'bey');
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateAvatarSettings({
        adminId,
        avatarProvider,
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
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-pink-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Video className="h-5 w-5 text-pink-400" />
            Avatar Provider
          </CardTitle>
          <CardDescription>Carregando configurações...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-pink-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Video className="h-5 w-5 text-pink-400" />
          Avatar Provider
        </CardTitle>
        <CardDescription>Configure qual provedor de avatar usar nas consultas com IA</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informação */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Sobre os Provedores de Avatar</p>
              <p className="text-xs text-blue-200/80">
                Configure qual tecnologia de avatar será usada nas consultas com IA em tempo real.
                Certifique-se de ter as credenciais corretas configuradas como variáveis de ambiente.
              </p>
            </div>
          </div>
        </div>

        {/* Opções de Avatar Provider */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white">Provedor de Avatar</h3>
          
          {/* Tavus */}
          <div
            onClick={() => {
              setAvatarProvider('tavus');
              setSaved(false);
              setError(null);
            }}
            className={`
              p-4 border rounded-lg cursor-pointer transition-all
              ${avatarProvider === 'tavus'
                ? 'bg-pink-500/20 border-pink-500 ring-2 ring-pink-500/50'
                : 'bg-slate-900/50 border-pink-500/20 hover:bg-pink-500/10 hover:border-pink-500/40'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${avatarProvider === 'tavus'
                      ? 'border-pink-500 bg-pink-500'
                      : 'border-gray-500'
                    }
                  `}>
                    {avatarProvider === 'tavus' && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="font-medium text-white">Tavus</span>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Avatar realista com tecnologia de conversação em tempo real
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-300 rounded">
                    Phoenix-3 PRO
                  </span>
                  <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-300 rounded">
                    Baixa Latência
                  </span>
                  <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-300 rounded">
                    Alta Qualidade
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Requer: TAVUS_API_KEY, TAVUS_REPLICA_ID, TAVUS_PERSONA_ID
                </p>
              </div>
            </div>
          </div>

          {/* Beyond Presence (BEY) */}
          <div
            onClick={() => {
              setAvatarProvider('bey');
              setSaved(false);
              setError(null);
            }}
            className={`
              p-4 border rounded-lg cursor-pointer transition-all
              ${avatarProvider === 'bey'
                ? 'bg-purple-500/20 border-purple-500 ring-2 ring-purple-500/50'
                : 'bg-slate-900/50 border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${avatarProvider === 'bey'
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-500'
                    }
                  `}>
                    {avatarProvider === 'bey' && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="font-medium text-white">Beyond Presence (BEY)</span>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Avatar hiper-realista com interatividade conversacional avançada
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                    Hiper-realista
                  </span>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                    Open Source
                  </span>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                    Alta Performance
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Requer: BEY_API_KEY
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagens de Status */}
        {saved && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Configurações salvas com sucesso!</span>
            </div>
            <p className="text-xs text-green-300/80 mt-1 ml-6">
              Reinicie o agente LiveKit para aplicar as mudanças.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Botão de Salvar */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
        >
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>

        {/* Aviso sobre reinicialização */}
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-300">
            ⚠️ Após alterar o provedor de avatar, você precisa reiniciar o workflow
            &quot;MediAI Avatar Agent&quot; para que as mudanças tenham efeito.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
