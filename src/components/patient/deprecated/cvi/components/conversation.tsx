
"use client";

import { useEffect, useCallback, useState, useRef } from 'react';
import {
    useDaily,
    useLocalSessionId,
    useScreenShare,
    useVideoTrack,
    useAudioTrack,
    DailyVideo,
    DailyAudio,
    useDevices,
    useMeetingState,
    useParticipantIds
} from '@daily-co/daily-react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';

interface ConversationProps {
    conversationUrl: string;
    onLeave: () => void;
}

export function Conversation({ conversationUrl, onLeave }: ConversationProps) {
    const daily = useDaily();
    const localSessionId = useLocalSessionId();
    const meetingState = useMeetingState();
    const participantIds = useParticipantIds();
    
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    
    // Usar useRef para evitar re-execução do effect
    const hasJoinedRef = useRef(false);

    const localVideo = useVideoTrack(localSessionId);
    const localAudio = useAudioTrack(localSessionId);
    
    const [remoteParticipants, setRemoteParticipants] = useState<Record<string, any>>({});

    // Event listeners robustos conforme documentação Tavus
    useEffect(() => {
        if (!daily) return;

        const updateRemoteParticipants = () => {
            const participants = daily.participants();
            const remotes: Record<string, any> = {};
            Object.entries(participants).forEach(([id, p]) => {
                if (id !== 'local') {
                    remotes[id] = p;
                }
            });
            setRemoteParticipants(remotes);
            console.log('[Conversation] Participantes remotos atualizados:', Object.keys(remotes));
        };

        // Callbacks para event listeners (necessário para cleanup)
        const handleParticipantJoined = (event: any) => {
            console.log('[Conversation] Participante entrou:', event?.participant?.user_name);
            updateRemoteParticipants();
        };

        const handleParticipantUpdated = (event: any) => {
            console.log('[Conversation] Participante atualizado:', event?.participant?.user_name);
            updateRemoteParticipants();
        };

        const handleParticipantLeft = (event: any) => {
            console.log('[Conversation] Participante saiu:', event?.participant?.user_name);
            updateRemoteParticipants();
        };

        // Adicionar event listeners conforme documentação
        daily.on('participant-joined', handleParticipantJoined);
        daily.on('participant-updated', handleParticipantUpdated);
        daily.on('participant-left', handleParticipantLeft);

        // Cleanup com callbacks corretos
        return () => {
            daily.off('participant-joined', handleParticipantJoined);
            daily.off('participant-updated', handleParticipantUpdated);
            daily.off('participant-left', handleParticipantLeft);
        };
    }, [daily]);

    // Conectar ao Daily.co quando o componente montar
    useEffect(() => {
        if (!daily || !conversationUrl || hasJoinedRef.current) return;

        const joinCall = async () => {
            try {
                console.log('[Conversation] Conectando ao Daily.co com URL:', conversationUrl);
                
                await daily.join({ 
                    url: conversationUrl,
                    userName: 'Paciente'
                });
                
                hasJoinedRef.current = true;
                console.log('[Conversation] Conectado com sucesso! hasJoined:', hasJoinedRef.current);
                
                // Ativar noise cancellation conforme documentação Tavus
                // Não usar await para evitar erros de console em navegadores incompatíveis
                daily.updateInputSettings({
                    audio: {
                        processor: {
                            type: 'noise-cancellation',
                        },
                    },
                })
                .then(() => {
                    console.log('[Conversation] ✅ Noise cancellation ativado com sucesso');
                })
                .catch((error) => {
                    // Erro esperado em navegadores que não suportam noise cancellation
                    console.log('[Conversation] ℹ️ Noise cancellation não disponível neste navegador (comportamento esperado)');
                });
            } catch (error) {
                console.error('[Conversation] Erro ao conectar ao Daily:', error);
                hasJoinedRef.current = false;
                onLeave();
            }
        };

        joinCall();

        // Cleanup apenas em teardown real (unmount)
        return () => {
            if (daily && hasJoinedRef.current) {
                console.log('[Conversation] Cleanup: deixando a sala Daily');
                daily.leave().catch(console.error);
                hasJoinedRef.current = false;
            }
        };
    }, [daily, conversationUrl, onLeave]);

    const toggleMic = useCallback(() => {
        if (!daily) return;
        daily.setLocalAudio(!isMicEnabled);
        setIsMicEnabled(!isMicEnabled);
    }, [daily, isMicEnabled]);

    const toggleCamera = useCallback(() => {
        if (!daily) return;
        daily.setLocalVideo(!isCameraEnabled);
        setIsCameraEnabled(!isCameraEnabled);
    }, [daily, isCameraEnabled]);

    const handleLeave = useCallback(async () => {
        if (daily) {
            await daily.leave();
        }
        onLeave();
    }, [daily, onLeave]);

    // Encontrar o participante AI (replica)
    const aiParticipantId = participantIds.find(id => id !== localSessionId);

    if (meetingState === 'joining-meeting') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Conectando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black rounded-lg overflow-hidden">
            {/* Área de vídeo */}
            <div className="flex-1 relative">
                {/* Vídeo do AI Avatar (principal) */}
                {aiParticipantId && (
                    <div className="w-full h-full">
                        <DailyVideo
                            sessionId={aiParticipantId}
                            type="video"
                            className="w-full h-full object-cover"
                        />
                        <DailyAudio />
                    </div>
                )}

                {/* Vídeo local (picture-in-picture) */}
                {localSessionId && isCameraEnabled && (
                    <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                        <DailyVideo
                            sessionId={localSessionId}
                            type="video"
                            className="w-full h-full object-cover mirror"
                        />
                    </div>
                )}
            </div>

            {/* Controles */}
            <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
                <Button
                    variant={isMicEnabled ? "default" : "destructive"}
                    size="icon"
                    onClick={toggleMic}
                    className="rounded-full w-12 h-12"
                >
                    {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                <Button
                    variant={isCameraEnabled ? "default" : "destructive"}
                    size="icon"
                    onClick={toggleCamera}
                    className="rounded-full w-12 h-12"
                >
                    {isCameraEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>

                <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleLeave}
                    className="rounded-full w-12 h-12"
                >
                    <PhoneOff className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
