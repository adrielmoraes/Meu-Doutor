
"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";
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
import { ScrollArea } from "../ui/scroll-area";
import { consultationFlow, type ConsultationInput } from "@/ai/flows/consultation-flow";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { saveConversationHistoryAction } from "./actions";


// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

// Speech Recognition instance will be stored in a ref
const AIConsultationCard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [avatarGender, setAvatarGender] = useState<"male" | "female">("female");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [history, setHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const femaleAvatarUrl = "https://placehold.co/128x128.png";
  const maleAvatarUrl = "https://placehold.co/128x128.png";

  useEffect(() => {
    audioRef.current = new Audio();

    // Initialize SpeechRecognition API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognitionRef.current = recognition;
    }
  }, []);
  
  const startConversation = () => {
    // A slight delay to ensure the user perceives the connection has been made
    setTimeout(() => {
        handleAiResponse("Olá");
    }, 500);
  }

  useEffect(() => {
    const getMediaPermissions = async () => {
      if (!isDialogOpen) return;

      try {
        // First, try to get both video and audio
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        startConversation(); // Start conversation on successful media acquisition
      } catch (err) {
        console.warn('Could not get video stream, trying audio only.', err);
        setHasCameraPermission(false);
        try {
          // If video fails (e.g., permission denied), try for audio only
          await navigator.mediaDevices.getUserMedia({ audio: true });
          startConversation(); // Start conversation if we at least have audio
        } catch (audioErr) {
            console.error('Error accessing audio:', audioErr);
            toast({
                variant: 'destructive',
                title: 'Acesso ao Microfone Negado',
                description: 'Por favor, habilite a permissão do microfone nas configurações do seu navegador para usar a consulta por voz.',
            });
        }
      }
    };

    getMediaPermissions();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [isDialogOpen, toast]);

  const handleAiResponse = async (userInput: string) => {
    const newUserMessage = { role: 'user' as const, content: userInput };
    // Don't show the initial "Olá" from the user in the history
    const isInitialMessage = userInput === "Olá" && history.length === 0;

    if (!isInitialMessage) {
      setHistory(prev => [...prev, newUserMessage]);
    }
    
    setIsThinking(true);
  
    try {
      // Get AI text response, now with patient context
      const currentHistory = isInitialMessage ? [] : [...history, newUserMessage];
      const input: ConsultationInput = { patientId: MOCK_PATIENT_ID, history: currentHistory, userInput };
      const result = await consultationFlow(input);
      const aiResponse = { role: 'model' as const, content: result.response };
  
      // Update history with the new AI response
      setHistory(prev => [...prev, aiResponse]);
  
      // Get AI audio response and play it
      const audioResponse = await textToSpeech({ text: result.response });
      if (audioRef.current) {
        audioRef.current.src = audioResponse.audioDataUri;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      toast({
        variant: "destructive",
        title: "Erro na comunicação com a IA",
        description: "Não foi possível obter uma resposta. Tente novamente.",
      });
      // Rollback the user message if AI fails and it wasn't the initial greeting
      if (!isInitialMessage) {
        setHistory(prev => prev.slice(0, -1));
      }
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    const handleResult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleAiResponse(transcript);
        setIsRecording(false);
    };

    const handleError = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({
            variant: 'destructive',
            title: 'Erro no Reconhecimento de Voz',
            description: 'Não foi possível entender o áudio. Tente novamente.',
        });
        setIsRecording(false);
    };

    const handleEnd = () => {
        setIsRecording(false);
    };

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('end', handleEnd);

    // Cleanup function
    return () => {
        recognition.removeEventListener('result', handleResult);
        recognition.removeEventListener('error', handleError);
        recognition.removeEventListener('end', handleEnd);
    }
  }, [history, toast]); // Dependency array is important to re-bind with correct history state

  const toggleRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
        toast({
            variant: 'destructive',
            title: 'Navegador incompatível',
            description: 'Seu navegador não suporta reconhecimento de voz.',
        });
        return;
    }
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
        setIsRecording(true);
    }
  };

  const handleEndCall = async () => {
    setIsDialogOpen(false);
    if (history.length > 0) {
        const result = await saveConversationHistoryAction(MOCK_PATIENT_ID, history);
        if (result.success) {
            toast({
                title: "Histórico Salvo",
                description: "Sua conversa com a IA foi salva com sucesso.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: result.message,
            });
        }
    }
    // Reset history for the next call
    setHistory([]);
  };


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
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background/90 overflow-hidden">
            <div className="md:col-span-2 bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
               <Image src={avatarGender === 'female' ? femaleAvatarUrl : maleAvatarUrl} alt="AI Assistant" layout="fill" objectFit="cover" data-ai-hint={`${avatarGender} portrait`} />
              <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded-lg text-sm">
                Assistente de IA { isThinking && (<span className="animate-pulse">está ouvindo...</span>) }
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-black rounded-lg h-48 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                 <video ref={videoRef} className={`w-full h-full object-cover ${!isVideoOn || !hasCameraPermission ? 'hidden' : ''}`} autoPlay muted playsInline />
                 
                 {(!isVideoOn || !hasCameraPermission) && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 text-white flex-col">
                        <VideoOff className="h-10 w-10 mb-2"/>
                        <span>Câmera desligada</span>
                    </div>
                 )}

                 <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded-lg text-sm">
                  Você
                </div>
              </div>
              <div className="bg-card p-4 rounded-lg flex-1 flex flex-col gap-2">
                 <ScrollArea className="flex-1 pr-4">
                   <div className="space-y-4">
                      {history.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          {msg.role === 'model' && <Avatar className="h-8 w-8"><AvatarFallback>AI</AvatarFallback></Avatar>}
                          <p className={`rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {msg.content}
                          </p>
                        </div>
                      ))}
                      {isThinking && (
                         <div className="flex items-start gap-2">
                           <Avatar className="h-8 w-8"><AvatarFallback>AI</AvatarFallback></Avatar>
                           <p className="rounded-lg px-3 py-2 text-sm bg-muted animate-pulse">...</p>
                         </div>
                      )}
                   </div>
                 </ScrollArea>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center gap-4 p-4 bg-card border-t">
            <ToggleGroup type="single" value={avatarGender} onValueChange={(value: "male" | "female") => value && setAvatarGender(value)} className="mr-auto">
                <ToggleGroupItem value="female" aria-label="Toggle female avatar">Feminino</ToggleGroupItem>
                <ToggleGroupItem value="male" aria-label="Toggle male avatar">Masculino</ToggleGroupItem>
            </ToggleGroup>
            <Button variant={isRecording ? "destructive" : "secondary"} size="icon" onClick={toggleRecording} disabled={isThinking}>
              {isRecording ? <MicOff /> : <Mic />}
            </Button>
            <Button variant={isVideoOn ? "secondary" : "destructive"} size="icon" onClick={() => setIsVideoOn(!isVideoOn)}>
              {isVideoOn ? <Video /> : <VideoOff />}
            </Button>
            <Button variant="destructive" size="lg" onClick={handleEndCall}>
              <Phone className="mr-2" /> Encerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIConsultationCard;
