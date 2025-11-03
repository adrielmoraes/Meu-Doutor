
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { liveConsultationFlow } from '@/ai/flows/live-consultation-flow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Send, Phone, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { getSessionOnClient } from '@/lib/session';

type Message = {
    id: string;
    source: 'user' | 'ai';
    text: string;
    timestamp: Date;
    isAudio?: boolean;
};

export default function LiveConsultationClient() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            source: 'ai',
            text: 'Olá! Sou sua assistente de saúde IA. Como posso ajudar você hoje?',
            timestamp: new Date(),
        }
    ]);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    
    const audioChunks = useRef<Blob[]>([]);
    const audioPlayer = useRef<HTMLAudioElement | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Get patient session
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const session = await getSessionOnClient();
                if (session?.userId) {
                    setPatientId(session.userId);
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Sessão não encontrada',
                        description: 'Por favor, faça login novamente.'
                    });
                }
            } catch (error) {
                console.error('Error fetching session:', error);
                toast({
                    variant: 'destructive',
                    title: 'Erro ao carregar sessão',
                    description: 'Tente recarregar a página.'
                });
            } finally {
                setIsLoadingSession(false);
            }
        };
        fetchSession();
    }, [toast]);

    useEffect(() => {
        if (typeof window !== 'undefined' && !audioPlayer.current) {
            audioPlayer.current = new Audio();
        }
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isProcessing]);

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
        
        // Block if session not loaded yet
        if (!patientId) {
            toast({
                variant: 'destructive',
                title: 'Aguarde',
                description: 'Carregando sua sessão...'
            });
            return;
        }
        
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
                
                // Add user audio message
                const userMessage: Message = {
                    id: Date.now().toString(),
                    source: 'user',
                    text: '🎤 Mensagem de áudio',
                    timestamp: new Date(),
                    isAudio: true,
                };
                setMessages(prev => [...prev, userMessage]);
                
                setIsProcessing(true);
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                audioChunks.current = [];

                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result?.toString().split(',')[1];
                    
                    try {
                        if (!base64Audio) {
                            throw new Error('Áudio não capturado corretamente');
                        }
                        
                        if (!patientId) {
                            throw new Error('Sessão de usuário não encontrada');
                        }
                        
                        const result = await liveConsultationFlow({ 
                            audioData: base64Audio,
                            patientId: patientId 
                        });
                        
                        if (result.audioOutput && audioPlayer.current) {
                            const audioBlob = new Blob([Buffer.from(result.audioOutput, 'base64')], { type: 'audio/webm' });
                            const audioUrl = URL.createObjectURL(audioBlob);
                            audioPlayer.current.src = audioUrl;
                            audioPlayer.current.play();
                        }

                        if (result.transcript) {
                            const aiMessage: Message = {
                                id: (Date.now() + 1).toString(),
                                source: 'ai',
                                text: result.transcript,
                                timestamp: new Date(),
                            };
                            setMessages(prev => [...prev, aiMessage]);
                        }

                    } catch (error) {
                        console.error('Flow failed', error);
                        toast({ 
                            variant: 'destructive', 
                            title: 'Erro na Consulta', 
                            description: error instanceof Error ? error.message : 'Não foi possível processar o áudio.' 
                        });
                    } finally {
                        // Always reset processing state
                        setIsProcessing(false);
                    }
                };
            };
            
            recorder.start();
            setIsRecording(true);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Acesso ao Microfone Negado', 
                description: 'Por favor, habilite o acesso ao microfone nas configurações do seu navegador.' 
            });
        }

    }, [isRecording, patientId, toast]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
           if (mediaRecorder && mediaRecorder.state === 'recording') {
               mediaRecorder.stop();
           }
           if (audioStream) {
               audioStream.getTracks().forEach(track => track.stop());
           }
           if (audioPlayer.current) {
               audioPlayer.current.pause();
               audioPlayer.current = null;
           }
        }
    }, [mediaRecorder, audioStream]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
            {/* WhatsApp-style Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 rounded-t-2xl shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                        <span className="text-2xl">🤖</span>
                    </div>
                    <div className="flex-1">
                        <h2 className="font-semibold text-lg">Assistente IA MediAI</h2>
                        <p className="text-xs text-teal-100">
                            {isProcessing ? 'digitando...' : 'online'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0">
                            <Video className="h-5 w-5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0">
                            <Phone className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* WhatsApp-style Chat Area */}
            <Card className="flex-1 bg-[#e5ddd5] rounded-none border-0 relative overflow-hidden">
                {/* WhatsApp Background Pattern */}
                <div className="absolute inset-0 opacity-40" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>

                <ScrollArea className="h-full p-4 relative z-10" ref={scrollAreaRef}>
                    <div className="space-y-3">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.source === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-lg px-4 py-2 shadow-md ${
                                        message.source === 'user'
                                            ? 'bg-[#dcf8c6] text-gray-800'
                                            : 'bg-white text-gray-800'
                                    }`}
                                    style={{
                                        borderRadius: message.source === 'user' 
                                            ? '8px 8px 0px 8px' 
                                            : '8px 8px 8px 0px'
                                    }}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                        {message.text}
                                    </p>
                                    <div className={`flex items-center gap-1 mt-1 ${
                                        message.source === 'user' ? 'justify-end' : 'justify-start'
                                    }`}>
                                        <span className="text-xs text-gray-500">
                                            {formatTime(message.timestamp)}
                                        </span>
                                        {message.source === 'user' && (
                                            <span className="text-blue-500">✓✓</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isProcessing && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-lg px-4 py-3 shadow-md" style={{borderRadius: '8px 8px 8px 0px'}}>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* WhatsApp-style Input Area */}
            <div className="bg-[#f0f0f0] p-3 rounded-b-2xl border-t border-gray-300 shadow-lg">
                <div className="flex items-center gap-3">
                    {/* Mic Button */}
                    {!isRecording ? (
                        <Button
                            onClick={startRecording}
                            disabled={isProcessing || isLoadingSession || !patientId}
                            size="lg"
                            className="rounded-full bg-teal-600 hover:bg-teal-700 text-white w-14 h-14 p-0 shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isLoadingSession ? 'Carregando sessão...' : !patientId ? 'Sessão não disponível' : 'Gravar mensagem de voz'}
                        >
                            <Mic className="h-6 w-6" />
                        </Button>
                    ) : (
                        <Button
                            onClick={stopRecording}
                            disabled={isProcessing}
                            size="lg"
                            className="rounded-full bg-red-500 hover:bg-red-600 text-white w-14 h-14 p-0 shadow-lg animate-pulse"
                        >
                            <MicOff className="h-6 w-6" />
                        </Button>
                    )}

                    {/* Input Field (disabled for now, audio only) */}
                    <div className="flex-1 bg-white rounded-full px-5 py-3 text-sm text-gray-400 cursor-not-allowed">
                        Clique no microfone para falar...
                    </div>

                    {/* Send Button (disabled) */}
                    <Button
                        disabled
                        size="lg"
                        className="rounded-full bg-gray-300 text-gray-500 w-14 h-14 p-0 cursor-not-allowed"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>

                {isRecording && (
                    <div className="mt-2 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-600 text-sm animate-pulse">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Gravando... Clique novamente para parar</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
