"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { getSessionOnClient } from '@/lib/session';
import { Badge } from '@/components/ui/badge';
import { CVIProvider } from './cvi/components/cvi-provider';
import { Conversation } from './cvi/components/conversation';
import { useRequestPermissions } from './cvi/hooks/use-request-permissions';

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
            text: 'Olá! 👋 Sou a MediAI, sua assistente de saúde. Pronto para começar?',
            timestamp: new Date(),
        }
    ]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [conversationUrl, setConversationUrl] = useState<string | null>(null);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    const { toast } = useToast();
    const requestPermissions = useRequestPermissions();

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
            // 1️⃣ PRIMEIRO: Pedir permissões de câmera e microfone
            console.log('[Tavus] Solicitando permissões de câmera e microfone...');
            await requestPermissions();
            console.log('[Tavus] Permissões concedidas!');

            // 2️⃣ DEPOIS: Criar conversa na API
            console.log('[Tavus] Criando conversa para paciente:', patientId);
            
            const response = await fetch('/api/tavus/create-conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    conversationName: `Consulta MediAI - ${new Date().toLocaleString('pt-BR')}`
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('[Tavus] Erro na API:', error);
                
                // Usar a mensagem de erro específica do backend
                const errorMessage = error.details || error.error || 'Falha ao criar conversa';
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('[Tavus] Conversa criada:', data);
            
            if (!data.conversationUrl) {
                throw new Error('URL da conversa não foi retornada pela API');
            }

            // 3️⃣ POR FIM: Definir URL da conversa (sem delay!)
            setConversationUrl(data.conversationUrl);

            toast({
                title: 'Conectado!',
                description: 'Você está conectado com a MediAI. Fale naturalmente!'
            });
        } catch (error: any) {
            console.error('[Tavus] Error starting conversation:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao conectar',
                description: error.message || 'Não foi possível iniciar a conversa. Tente novamente.'
            });
            setConversationUrl(null);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleLeaveConversation = () => {
        setConversationUrl(null);
        toast({
            title: 'Conversa encerrada',
            description: 'A consulta foi finalizada com sucesso.'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <CVIProvider>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                {/* Video Avatar Area */}
                <Card className="lg:col-span-2 p-6 relative overflow-hidden">
                    {/* Video Background */}
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                    >
                        <source src="/ai-assistant-video.mp4" type="video/mp4" />
                    </video>
                    
                    {/* Overlay with 30% opacity */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-purple-900/30" />
                    
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        {conversationUrl && (
                            <Badge className="bg-green-500 animate-pulse">
                                ● Ao Vivo
                            </Badge>
                        )}
                    </div>

                    <div className="w-full h-full min-h-[500px] flex items-center justify-center rounded-lg overflow-hidden relative z-10">
                        {!conversationUrl && !isConnecting && (
                            <div className="flex flex-col items-center gap-6 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shadow-lg">
                                    <span className="text-6xl">🩺</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold mb-2 text-gray-900">Assistente Médico MediAI</h3>
                                    <p className="text-sm text-gray-700 mb-4">
                                        Tire suas dúvidas de saúde com um assistente que conhece todo o seu histórico médico
                                        <br />
                                        <span className="text-xs text-blue-600 font-medium">Disponível 24/7 para orientá-lo sobre exames e tratamentos</span>
                                    </p>
                                    <Button 
                                        onClick={startConversation}
                                        disabled={isLoadingSession || !patientId}
                                        size="lg"
                                        className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-xl"
                                    >
                                        <Phone className="mr-2 h-5 w-5" />
                                        Iniciar Consulta ao Vivo
                                    </Button>
                                </div>
                            </div>
                        )}

                        {isConnecting && (
                            <div className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
                                <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                                <p className="text-sm text-gray-900 font-medium">
                                    Conectando com a MediAI...
                                </p>
                                <div className="text-xs text-gray-700 text-center max-w-md">
                                    <p className="mb-2">Aguardando permissões de câmera e microfone</p>
                                    <p className="text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-lg">
                                        ⚠️ Por favor, clique em "Permitir" quando seu navegador solicitar acesso
                                    </p>
                                </div>
                            </div>
                        )}

                        {conversationUrl && (
                            <div className="w-full h-full">
                                <Conversation
                                    conversationUrl={conversationUrl}
                                    onLeave={handleLeaveConversation}
                                />
                            </div>
                        )}
                    </div>
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
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </CVIProvider>
    );
}