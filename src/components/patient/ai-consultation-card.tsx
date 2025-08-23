
"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Phone, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const AIConsultationCard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [avatarGender, setAvatarGender] = useState<"male" | "female">("female");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();


  const femaleAvatarUrl = "https://placehold.co/128x128.png";
  const maleAvatarUrl = "https://placehold.co/128x128.png";

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!isDialogOpen) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acesso à Câmera Negado',
          description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador para usar esta funcionalidade.',
        });
      }
    };

    getCameraPermission();

    // Cleanup function to stop the video stream when the dialog is closed
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [isDialogOpen, toast]);


  return (
    <>
      <Card className="flex flex-col justify-between transform transition-transform duration-300 hover:scale-105 hover:shadow-xl bg-primary text-primary-foreground">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={femaleAvatarUrl} data-ai-hint="woman portrait" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold">
                Consulta com a IA
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Inicie uma videochamada com seu assistente.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            size="lg"
          >
            <Video className="mr-2 h-5 w-5" />
            Iniciar Chamada
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Consulta com Assistente de IA</DialogTitle>
          </DialogHeader>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background/90">
            <div className="md:col-span-2 bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
               <Image src={avatarGender === 'female' ? femaleAvatarUrl : maleAvatarUrl} alt="AI Assistant" layout="fill" objectFit="cover" data-ai-hint={`${avatarGender} portrait`} />
              <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded-lg text-sm">
                Assistente de IA
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-black rounded-lg flex-1 relative overflow-hidden flex items-center justify-center">
                 <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                 <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded-lg text-sm">
                  Você
                </div>
                 {hasCameraPermission === false && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
                        <Alert variant="destructive">
                            <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                            <AlertDescription>
                                Por favor, permita o acesso à câmera para usar esta funcionalidade.
                            </AlertDescription>
                        </Alert>
                    </div>
                 )}
              </div>
              <div className="bg-card p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Selecione o avatar da IA:</p>
                <ToggleGroup type="single" value={avatarGender} onValueChange={(value: "male" | "female") => value && setAvatarGender(value)}>
                  <ToggleGroupItem value="female" aria-label="Toggle female avatar">
                    Feminino
                  </ToggleGroupItem>
                  <ToggleGroupItem value="male" aria-label="Toggle male avatar">
                    Masculino
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center gap-4 p-4 bg-card border-t">
            <Button variant={isMicOn ? "secondary" : "destructive"} size="icon" onClick={() => setIsMicOn(!isMicOn)}>
              {isMicOn ? <Mic /> : <MicOff />}
            </Button>
            <Button variant={isVideoOn ? "secondary" : "destructive"} size="icon" onClick={() => setIsVideoOn(!isVideoOn)}>
              {isVideoOn ? <Video /> : <VideoOff />}
            </Button>
            <Button variant="destructive" size="lg" onClick={() => setIsDialogOpen(false)}>
              <Phone className="mr-2" /> Encerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIConsultationCard;
