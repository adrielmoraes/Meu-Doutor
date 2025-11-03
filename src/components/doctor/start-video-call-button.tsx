'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Loader2 } from 'lucide-react';
import { startVideoCallAction } from '@/app/doctor/schedule/video-call-actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface StartVideoCallButtonProps {
  patientId: string;
  appointmentId: string;
  patientName: string;
}

export default function StartVideoCallButton({ 
  patientId, 
  appointmentId,
  patientName 
}: StartVideoCallButtonProps) {
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleStartCall = async () => {
    setIsStarting(true);
    
    try {
      const result = await startVideoCallAction(patientId, appointmentId);
      
      if (result.success && result.redirectUrl) {
        toast({
          title: 'Iniciando chamada',
          description: `Conectando com ${patientName}...`,
          className: 'bg-green-100 text-green-800 border-green-200'
        });
        
        router.push(result.redirectUrl);
      }
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
      toast({
        title: 'Erro ao iniciar chamada',
        description: 'Não foi possível iniciar a videochamada. Tente novamente.',
        variant: 'destructive'
      });
      setIsStarting(false);
    }
  };

  return (
    <Button 
      size="icon" 
      variant="ghost"
      onClick={handleStartCall}
      disabled={isStarting}
      title="Iniciar videochamada"
    >
      {isStarting ? (
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      ) : (
        <Video className="h-5 w-5 text-primary" />
      )}
    </Button>
  );
}
