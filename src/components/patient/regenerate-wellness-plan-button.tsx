'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { regenerateWellnessPlanAction } from './wellness-actions';

interface RegenerateWellnessPlanButtonProps {
  patientId: string;
}

export default function RegenerateWellnessPlanButton({ patientId }: RegenerateWellnessPlanButtonProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateWellnessPlanAction(patientId);
      
      if (result.success) {
        toast({
          title: "Plano Atualizado!",
          description: "Seu plano de bem-estar foi atualizado com base nos seus exames mais recentes.",
          className: "bg-green-100 border-green-200 text-green-800",
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.message || "Não foi possível atualizar o plano de bem-estar.",
        });
      }
    } catch (error) {
      console.error('Failed to regenerate wellness plan:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o plano de bem-estar.",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Button
      onClick={handleRegenerate}
      disabled={isRegenerating}
      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all"
    >
      {isRegenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Atualizando...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar Plano
        </>
      )}
    </Button>
  );
}
