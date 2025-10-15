
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Phone, Loader2, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { getSessionOnClient } from '@/lib/session';
import { Badge } from '@/components/ui/badge';

type Message = {
    id: string;
    source: 'user' | 'ai';
    text: string;
    timestamp: Date;
};

export default function TavusConsultationClient() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            source: 'ai',
            text: 'Olá! 👋 Sou a MediAI, sua assistente de saúde. Como posso ajudar você hoje?',
            timestamp: new Date(),
        }
    ]);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
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

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const startConversation = async () => {
        if (!patientId) {
            toast({
                variant: 'destructive',
                title: 'Aguarde',
                description: 'Carregando sua sessão...'
            });
            return;
        }

        setIsConnecting(true);
        try {
            const response = await fetch('/api/tavus/create-conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    conversationName: `Consulta MediAI - ${new Date().toLocaleString('pt-BR')}`
                })
            });

            if (!response.ok) throw new Error('Falha ao criar conversa');

            const data = await response.json();
            setConversationId(data.conversationId);
            
            // Inicializar Tavus SDK
            await initializeTavusSDK(data.conversationId);
            
            setIsConnected(true);
            toast({
                title: 'Conectado!',
                description: 'Você está conectado com a MediAI.'
            });
        } catch (error) {
            console.error('Error starting conversation:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao conectar',
                description: 'Não foi possível iniciar a conversa. Tente novamente.'
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const initializeTavusSDK = async (convId: string) => {
        if (!videoRef.current) return;

        // Carregar Tavus SDK
        const script = document.createElement('script');
        script.src = 'https://sdk.tavus.io/tavus-sdk.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve) => {
            script.onload = resolve;
        });

        // Inicializar SDK
        const tavus = new (window as any).TavusSDK({
            conversationId: convId,
            videoElement: videoRef.current,
            onConversationStart: () => {
                console.log('[Tavus] Conversa iniciada');
            },
            onTranscript: (transcript: { speaker: string; text: string }) => {
                const message: Message = {
                    id: Date.now().toString(),
                    source: transcript.speaker === 'user' ? 'user' : 'ai',
                    text: transcript.text,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, message]);
            },
            onError: (error: Error) => {
                console.error('[Tavus] Error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Erro na conversa',
                    description: error.message
                });
            }
        });

        await tavus.start();
    };

    const endConversation = async () => {
        if (!conversationId) return;

        try {
            await fetch('/api/tavus/end-conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId })
            });

            setIsConnected(false);
            setConversationId(null);
            
            toast({
                title: 'Conversa encerrada',
                description: 'A consulta foi finalizada com sucesso.'
            });
        } catch (error) {
            console.error('Error ending conversation:', error);
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        // Implementar mute no Tavus SDK
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Video Avatar Area */}
            <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950 p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    {isConnected && (
                        <Badge className="bg-green-500 animate-pulse">
                            ● Ao Vivo
                        </Badge>
                    )}
                </div>

                <div className="w-full h-full min-h-[500px] flex items-center justify-center rounded-lg overflow-hidden bg-black/5">
                    {!isConnected && !isConnecting && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                                <span className="text-6xl">🤖</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-2">Avatar MediAI Realista</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Conversação em tempo real com sincronização labial natural
                                </p>
                                <Button 
                                    onClick={startConversation}
                                    disabled={isLoadingSession || !patientId}
                                    size="lg"
                                    className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                                >
                                    <Phone className="mr-2 h-5 w-5" />
                                    Iniciar Consulta
                                </Button>
                            </div>
                        </div>
                    )}

                    {isConnecting && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Conectando com a MediAI...
                            </p>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        className={`w-full h-full object-cover rounded-lg ${isConnected ? 'block' : 'hidden'}`}
                        autoPlay
                        playsInline
                    />
                </div>

                {isConnected && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                        <Button
                            onClick={toggleMute}
                            size="lg"
                            variant={isMuted ? "destructive" : "secondary"}
                            className="rounded-full w-14 h-14 p-0 shadow-lg"
                        >
                            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                        </Button>
                        <Button
                            onClick={endConversation}
                            size="lg"
                            variant="destructive"
                            className="rounded-full w-14 h-14 p-0 shadow-lg"
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>
                    </div>
                )}
            </Card>

            {/* Chat Transcript Area */}
            <Card className="bg-white dark:bg-gray-900 flex flex-col">
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 rounded-t-lg">
                    <h2 className="font-semibold text-lg">Transcrição da Conversa</h2>
                    <p className="text-xs text-teal-100">
                        Acompanhe o que está sendo dito em tempo real
                    </p>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.source === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-lg px-4 py-2 shadow-md ${
                                        message.source === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                                    }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                        {message.text}
                                    </p>
                                    <div className={`flex items-center gap-1 mt-1 ${
                                        message.source === 'user' ? 'justify-end' : 'justify-start'
                                    }`}>
                                        <span className="text-xs opacity-70">
                                            {formatTime(message.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </Card>
        </div>
    );
}
