
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Video, VideoOff, Mic, MicOff, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'failed' | 'connected'>('idle');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);


  const Icon = type === 'video' ? Video : Phone;
  const buttonText = type === 'video' ? 'Videochamada' : 'Voz';
  const buttonVariant = type === 'video' ? 'default' : 'secondary';

  useEffect(() => {
    // This effect handles the call simulation logic when the dialog opens.
    if (!isOpen) {
        setCallStatus('idle');
        return;
    }

    let connectionTimer: NodeJS.Timeout;
    const videoEl = videoRef.current;

    const startCallSimulation = async () => {
        setCallStatus('connecting');
        try {
            // Request camera and microphone permissions
            const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
            setHasCameraPermission(true);
            if (videoEl) {
                videoEl.srcObject = stream;
            }

            // Simulate a 5-second connection attempt
            connectionTimer = setTimeout(() => {
                setCallStatus('failed'); // Simulate that the doctor did not answer
            }, 5000);

        } catch (error) {
            console.error('Error accessing media devices:', error);
            setHasCameraPermission(false);
            setCallStatus('failed');
        }
    };

    startCallSimulation();

    // Cleanup function to stop media tracks and clear timers
    return () => {
        if (videoEl?.srcObject) {
            const stream = videoEl.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoEl.srcObject = null;
        }
        if (connectionTimer) {
            clearTimeout(connectionTimer);
        }
    };
  }, [isOpen, type]);


  const handleClose = () => {
    setIsOpen(false);
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant={buttonVariant} disabled={!doctor.online}>
          <Icon className="mr-2 h-4 w-4" /> {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chamada com {doctor.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 my-4">
             {/* Doctor's View */}
            <div className="bg-black rounded-lg flex flex-col items-center justify-center p-4 space-y-4 min-h-[250px] text-white">
                <Avatar className="h-24 w-24 border-4 border-primary">
                    <AvatarImage src={doctor.avatar} data-ai-hint={doctor.avatarHint} />
                    <AvatarFallback>{doctor.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <p>{doctor.name}</p>
                 {callStatus === 'connecting' && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm">Chamando...</p>
                    </div>
                 )}
                 {callStatus === 'failed' && (
                    <p className="text-sm text-red-400">Não atendeu</p>
                 )}
            </div>
            {/* Patient's View */}
            <div className="bg-black rounded-lg flex items-center justify-center relative min-h-[250px] overflow-hidden">
                <video ref={videoRef} className={`w-full h-full object-cover rounded-lg ${!isVideoOn || hasCameraPermission === false ? 'hidden' : ''}`} autoPlay muted playsInline />

                {(!isVideoOn || hasCameraPermission === false) && (
                    <div className="flex flex-col items-center justify-center text-white">
                        <VideoOff className="h-16 w-16" />
                        <p className="mt-2">Câmera desligada</p>
                    </div>
                )}
                 {hasCameraPermission === false && callStatus !== 'idle' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
                        <Alert variant="destructive">
                            <AlertTitle>Acesso à Câmera Negado</AlertTitle>
                        </Alert>
                    </div>
                 )}
            </div>
        </div>
         {callStatus === 'failed' && (
            <Alert variant="destructive">
                <AlertTitle>Chamada não atendida</AlertTitle>
                <AlertDescription>
                    {doctor.name} não está disponível no momento. Tente novamente mais tarde ou agende uma consulta.
                </AlertDescription>
            </Alert>
        )}
        <DialogFooter className="flex items-center justify-center gap-4 bg-card pt-4">
             <Button variant={isMicOn ? "secondary" : "destructive"} size="icon" onClick={() => setIsMicOn(!isMicOn)}>
              {isMicOn ? <Mic /> : <MicOff />}
            </Button>
            <Button variant={isVideoOn ? "secondary" : "destructive"} size="icon" onClick={() => setIsVideoOn(!isVideoOn)}>
              {isVideoOn ? <Video /> : <VideoOff />}
            </Button>
            <Button variant="destructive" size="lg" onClick={handleClose}>
              <Phone className="mr-2" /> Encerrar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
