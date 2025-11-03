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
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-cyan-500/20 backdrop-blur-sm">
      <Power className={`h-5 w-5 ${isOnline ? 'text-green-400' : 'text-gray-400'}`} />
      <div className="flex-1">
        <Label htmlFor="online-status" className="text-sm font-medium cursor-pointer">
          Status de Disponibilidade
        </Label>
        <p className="text-xs text-muted-foreground">
          {isOnline ? 'Online - Visível para pacientes' : 'Offline - Invisível'}
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
