
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Video, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Doctor } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type ConsultationType = 'video' | 'voice';

type StartConsultationProps = {
  doctor: Doctor;
  type: ConsultationType;
};

export default function StartConsultation({ doctor, type }: StartConsultationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'failed'>('idle');

  const Icon = type === 'video' ? Video : Phone;
  const buttonText = type === 'video' ? 'Videochamada' : 'Voz';
  const buttonVariant = type === 'video' ? 'default' : 'secondary';

  useEffect(() => {
    if (!isOpen) {
      setCallStatus('idle');
      setIsConnecting(false);
      return;
    }

    setIsConnecting(true);
    setCallStatus('connecting');

    const timer = setTimeout(() => {
      setIsConnecting(false);
      setCallStatus('failed');
    }, 3000); // Simulate connection attempt for 3 seconds

    return () => clearTimeout(timer);

  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant={buttonVariant} disabled={!doctor.online}>
          <Icon className="mr-2 h-4 w-4" /> {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciando chamada com {doctor.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarImage src={doctor.avatar} data-ai-hint={doctor.avatarHint} />
                <AvatarFallback>{doctor.name.substring(0, 2)}</AvatarFallback>
            </Avatar>

            {callStatus === 'connecting' && (
                <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Conectando...</p>
                </>
            )}

            {callStatus === 'failed' && (
                 <Alert variant="destructive">
                    <AlertTitle>Chamada não atendida</AlertTitle>
                    <AlertDescription>
                        {doctor.name} não está disponível no momento. Tente novamente mais tarde ou agende uma consulta.
                    </AlertDescription>
                </Alert>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
