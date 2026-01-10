'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Power, Loader2 } from 'lucide-react';
import { toggleDoctorOnlineStatus } from '@/app/doctor/actions';
import { useToast } from '@/hooks/use-toast';

type OnlineStatusToggleProps = {
  initialStatus: boolean;
  doctorName: string;
};

export function OnlineStatusToggle({ initialStatus, doctorName }: OnlineStatusToggleProps) {
  const [isOnline, setIsOnline] = useState(initialStatus);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    setIsPending(true);

    try {
      const result = await toggleDoctorOnlineStatus(checked);

      if (result.success) {
        setIsOnline(checked);
        toast({
          title: checked ? '✅ Você está Online' : '⏸️ Você está Offline',
          description: checked
            ? 'Pacientes podem ver que você está disponível para consultas.'
            : 'Você está invisível para novos pacientes.',
          className: checked ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: result.message || 'Não foi possível atualizar seu status.'
        });
      }
    } catch (error) {
      console.error('Erro ao alternar status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.'
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:border-blue-200">
      <div className={`p-2 rounded-full ${isOnline ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
        <Power className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-[120px]">
        <Label htmlFor="online-status" className="text-[13px] font-bold text-slate-900 cursor-pointer block mb-0.5">
          Status Online
        </Label>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">
          {isOnline ? 'Visível para pacientes' : 'Modo invisível'}
        </p>
      </div>
      {isPending ? (
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
      ) : (
        <Switch
          id="online-status"
          checked={isOnline}
          onCheckedChange={handleToggle}
          disabled={isPending}
          className="data-[state=checked]:bg-green-500"
        />
      )}
    </div>
  );
}
