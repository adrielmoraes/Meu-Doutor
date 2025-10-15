"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, Phone, Loader2, Brain } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { RealisticAvatar } from "./realistic-avatar";
import { consultationFlow } from "@/ai/flows/consultation-flow";
import { saveConversationHistoryAction } from "./actions";
import { getSessionOnClient } from "@/lib/session";
import type { SessionPayload } from "@/lib/session";
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';


type Message = {
    role: 'user' | 'model';
    content: { text: string }[];
};


const AIConsultationCard = () => {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [avatarGender, setAvatarGender] = useState<"male" | "female">("female");
  const [avatarType, setAvatarType] = useState<'3d' | 'd-id'>('3d');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | undefined>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const userMediaStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();


   useEffect(() => {
    // Fetch session data on the client
    getSessionOnClient().then(setSession);

    // This ensures that the Audio object is only created on the client-side
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    // Cleanup function to stop media tracks when component unmounts
    return () => {
         if (userMediaStreamRef.current) {
            userMediaStreamRef.current.getTracks().forEach(track => track.stop());
            userMediaStreamRef.current = null;
        }
    }
  }, []);


  const stopAiSpeaking = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, []);

  const handleAiResponse = useCallback(async (userInput: string) => {
    if (!userInput.trim() || !session?.userId) {
        if (!session?.userId) {
             toast({
                variant: 'destructive',
                title: 'Erro de Autenticação',
                description: 'Não foi possível identificar o usuário. Por favor, faça login novamente.',
            });
        }
        return;
    }

    stopAiSpeaking();
    setIsThinking(true);
    setIsSpeaking(false);

    const newUserMessage: Message = { role: 'user', content: [{ text: userInput }] };
    const newHistory = [...history, newUserMessage];
    setHistory(newHistory);

    try {
      const result = await consultationFlow({ patientId: session.userId, history: newHistory });

      const aiResponseMessage: Message = { role: 'model', content: [{ text: result.response }] };
      setHistory(prev => [...prev, aiResponseMessage]);

      if (isDialogOpen && result.audioDataUri) {
        const base64Audio = result.audioDataUri.split('base64,')[1];
        if (base64Audio) {
          setCurrentAudioBase64(base64Audio);
          setIsSpeaking(true);
        }
      }

    } catch (error) {
      console.error("Failed to get AI response:", error);
      toast({
        variant: "destructive",
        title: "Erro na comunicação com a IA",
        description: "Não foi possível obter uma resposta. Tente novamente.",
      });
      // Rollback user message on error
      setHistory(prev => prev.slice(0, -1));
    } finally {
      setIsThinking(false);
    }
  }, [stopAiSpeaking, isDialogOpen, toast, history, session]);


  const handleAiResponseRef = useRef(handleAiResponse);
  useEffect(() => {
    handleAiResponseRef.current = handleAiResponse;
  }, [handleAiResponse]);


  const startConversation = useCallback(() => {
    if (history.length === 0) {
        handleAiResponse("Olá");
    }
  }, [handleAiResponse, history.length]);


  const initializeSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) return;

    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Navegador incompatível',
        description: 'Seu navegador não suporta reconhecimento de voz.',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;

    recognition.onspeechstart = stopAiSpeaking;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if(transcript) {
        handleAiResponseRef.current(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error', event.error);
        toast({ variant: 'destructive', title: 'Erro no Reconhecimento de Voz', description: `Ocorreu um erro: ${event.error}.`});
        if(recognitionRef.current) {
            recognitionRef.current.stop();
        }
      }
    };

    recognitionRef.current = recognition;
  }, [toast, stopAiSpeaking]);

  const toggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);

    if (nextState) {
        if (!recognitionRef.current) initializeSpeechRecognition();
        try {
            recognitionRef.current.start();
        } catch (e) {
            // Already started
        }
    } else {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
};

  const handleEndCall = async () => {
    setIsDialogOpen(false);
  };

  // Effect to manage dialog lifecycle
  useEffect(() => {
    if (!isDialogOpen) {
        // Cleanup when dialog closes
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        stopAiSpeaking();

        // Convert history to storable format (string content) before saving.
        if (history.length > 1 && session?.userId) {
            const storableHistory = history.map(msg => ({
                role: msg.role,
                content: msg.content[0].text,
            }));
            saveConversationHistoryAction(session.userId, storableHistory);
        }

        // Reset state for next call
        setHistory([]);
        setIsMicOn(false);
        setIsVideoOn(true);
        if (userMediaStreamRef.current) {
          userMediaStreamRef.current.getTracks().forEach(track => track.stop());
          userMediaStreamRef.current = null;
        }

        // Cleanup video refs
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = null;
        }

        setHasCameraPermission(null);
        return;
    }

    // When dialog opens, connect the stream to the main video element
    if (userMediaStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = userMediaStreamRef.current;
    }
    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen, session]);

  return (
    <>
      <Card className="flex flex-col justify-between transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30">
              <Brain className="h-8 w-8 text-purple-300" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Consulta com IA
              </CardTitle>
              <CardDescription className="text-blue-200/70">
                Converse com seu assistente por vídeo e voz
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/40 rounded-xl aspect-video overflow-hidden flex items-center justify-center border border-purple-500/20 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            <div className="relative flex flex-col items-center gap-3 z-10">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-110 transition-transform duration-300">
                <Video className="h-12 w-12 text-purple-300" />
              </div>
              <p className="text-sm text-purple-300/80 font-medium">Avatar 3D com IA pronto para atender</p>
            </div>
          </div>
          <Button
            onClick={async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                userMediaStreamRef.current = stream;
                setHasCameraPermission(true);
                if (previewVideoRef.current) {
                    previewVideoRef.current.srcObject = stream;
                }
                setIsDialogOpen(true);
              } catch (err) {
                  console.error('Error accessing media devices:', err);
                  setHasCameraPermission(false);
                  toast({
                      variant: 'destructive',
                      title: 'Acesso à Mídia Negado',
                      description: 'Por favor, habilite o acesso à câmera e ao microfone nas configurações do seu navegador para usar a consulta por vídeo.',
                  });
              }
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300"
            size="lg"
            disabled={!session}
          >
            <Video className="mr-2 h-5 w-5" />
            Iniciar Chamada com IA
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
              <RealisticAvatar
                isListening={isMicOn}
                isSpeaking={isSpeaking}
                audioBase64={currentAudioBase64}
                onAudioEnd={() => setIsSpeaking(false)}
                avatarType={avatarType}
                gender={avatarGender}
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-black rounded-lg h-48 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                 <video ref={videoRef} className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`} autoPlay muted playsInline />

                 {!isVideoOn && (
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
                            {msg.content[0].text}
                          </p>
                        </div>
                      ))}
                      {isThinking && (
                         <div className="flex items-start gap-2">
                           <Avatar className="h-8 w-8"><AvatarFallback>AI</AvatarFallback></Avatar>
                           <p className="rounded-lg px-3 py-2 text-sm bg-muted animate-pulse">...</p>
                         </div>
                      )}
                       <div ref={messagesEndRef} />
                   </div>
                 </ScrollArea>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center gap-4 p-4 bg-card border-t">
            <div className="flex gap-2 mr-auto">
              <ToggleGroup type="single" value={avatarGender} onValueChange={(value: "male" | "female") => value && setAvatarGender(value)}>
                  <ToggleGroupItem value="female" aria-label="Toggle female avatar">Feminino</ToggleGroupItem>
                  <ToggleGroupItem value="male" aria-label="Toggle male avatar">Masculino</ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup type="single" value={avatarType} onValueChange={(value: '3d' | 'd-id') => value && setAvatarType(value)}>
                  <ToggleGroupItem value="3d" aria-label="Toggle 3D avatar">3D</ToggleGroupItem>
                  <ToggleGroupItem value="d-id" aria-label="Toggle D-ID avatar">D-ID</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Button variant={isMicOn ? "secondary" : "destructive"} size="icon" onClick={toggleMic}>
              {isMicOn ? <Mic /> : <MicOff />}
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