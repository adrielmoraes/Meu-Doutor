
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { liveConsultationFlow } from '@/ai/flows/live-consultation-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Phone, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';

type TranscriptItem = {
    source: 'user' | 'model';
    text: string;
    isFinal: boolean;
};

// This component simulates a real-time audio conversation with the Gemini API.
// NOTE: This is a high-fidelity simulation. A production implementation would
// typically use a dedicated WebSocket server to manage the bidirectional stream
// between the client and the Gemini API for optimal performance and security.
// Here, we use Next.js Server Actions as a proxy.

export default function LiveConsultationClient() {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModelSpeaking, setIsModelSpeaking] = useState(false);
    
    const audioChunks = useRef<Blob[]>([]);
    const audioPlayer = useRef<HTMLAudioElement>(new Audio());
    const { toast } = useToast();

    const femaleAvatarUrl = "https://placehold.co/128x128.png";

    // Function to handle incoming audio from the server action
    const handleAudioChunk = useCallback((audioData: string) => {
        try {
            const audioBlob = new Blob([Buffer.from(audioData, 'base64')], { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            setIsModelSpeaking(true);
            audioPlayer.current.src = audioUrl;
            audioPlayer.current.play();
            
            audioPlayer.current.onended = () => {
                setIsModelSpeaking(false);
            };

        } catch (error) {
            console.error("Error playing audio chunk:", error);
            setIsModelSpeaking(false);
        }
    }, []);

    // Function to handle incoming transcript updates
    const handleTranscriptUpdate = useCallback((newTranscript: TranscriptItem) => {
        setTranscript(prev => {
            const last = prev[prev.length - 1];
            // If the last transcript item is from the same source and not final, update it
            if (last && last.source === newTranscript.source && !last.isFinal) {
                const updated = [...prev.slice(0, -1), newTranscript];
                return updated;
            }
            // Otherwise, add a new transcript item
            return [...prev, newTranscript];
        });
    }, []);

    const stopRecording = useCallback(async () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        if(audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
        setAudioStream(null);
    }, [mediaRecorder, audioStream]);
    
    const startRecording = useCallback(async () => {
        if (isRecording) return;
        setTranscript([]); // Clear previous transcript
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioStream(stream);

            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            setMediaRecorder(recorder);
            
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };
            
            recorder.onstop = async () => {
                 if (audioChunks.current.length === 0) return;
                
                 setIsProcessing(true);
                 const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                 audioChunks.current = [];

                 const reader = new FileReader();
                 reader.readAsDataURL(audioBlob);
                 reader.onloadend = async () => {
                     const base64Audio = reader.result?.toString().split(',')[1];
                     if (base64Audio) {
                         try {
                             await liveConsultationFlow({ 
                                 audioData: base64Audio,
                                 onAudioChunk: handleAudioChunk,
                                 onTranscriptUpdate: handleTranscriptUpdate
                             });
                         } catch (error) {
                             console.error('Flow failed', error);
                             toast({ variant: 'destructive', title: 'Erro na Consulta', description: 'Não foi possível processar o áudio.' });
                         } finally {
                             setIsProcessing(false);
                         }
                     }
                 };
            };
            
            recorder.start();
            setIsRecording(true);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast({ variant: 'destructive', title: 'Acesso ao Microfone Negado', description: 'Por favor, habilite o acesso ao microfone nas configurações do seu navegador.' });
        }

    }, [isRecording, toast, handleAudioChunk, handleTranscriptUpdate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
           if (mediaRecorder && mediaRecorder.state === 'recording') {
               mediaRecorder.stop();
           }
           if (audioStream) {
               audioStream.getTracks().forEach(track => track.stop());
           }
        }
    }, [mediaRecorder, audioStream]);


    return (
        <Card className="w-full">
            <CardContent className="p-4 md:p-6">
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden mb-4">
                     <Image src={femaleAvatarUrl} alt="AI Assistant" layout="fill" objectFit="cover" data-ai-hint="woman portrait" />
                     <div className="absolute inset-0 bg-black/40 z-10" />

                     {/* Status Indicator */}
                     <div className="absolute top-4 left-4 z-20">
                        {isRecording ? (
                            <div className="flex items-center gap-2 rounded-full bg-red-500/80 px-3 py-1 text-white text-sm animate-pulse">
                                <Mic className="h-4 w-4" />
                                <span>Gravando</span>
                            </div>
                        ) : (
                             <div className="flex items-center gap-2 rounded-full bg-gray-500/80 px-3 py-1 text-white text-sm">
                                <MicOff className="h-4 w-4" />
                                <span>Pronto</span>
                            </div>
                        )}
                     </div>

                    {/* Transcript Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20 h-48">
                         <ScrollArea className="h-full w-full">
                            <div className="flex flex-col gap-2">
                                {transcript.map((item, index) => (
                                    <div key={index} className={`max-w-[80%] rounded-xl px-4 py-2 text-white ${item.source === 'user' ? 'bg-blue-600/80 self-end' : 'bg-black/60 self-start'} ${!item.isFinal ? 'opacity-70' : ''}`}>
                                        <span className='font-bold capitalize'>{item.source === 'model' ? 'IA' : 'Você'}: </span>{item.text}
                                    </div>
                                ))}
                                {isProcessing && <Loader2 className="h-6 w-6 animate-spin text-white self-center mt-2" />}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                    {!isRecording ? (
                        <Button onClick={startRecording} size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700">
                            <Mic className="mr-2" /> Iniciar Conversa
                        </Button>
                    ) : (
                        <Button onClick={stopRecording} size="lg" variant="destructive" className="rounded-full">
                            <Square className="mr-2" /> Parar Gravação
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
