
"use client";

import { useEffect, useCallback, useState } from 'react';
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

    const localVideo = useVideoTrack(localSessionId);
    const localAudio = useAudioTrack(localSessionId);

    // Conectar ao Daily.co quando o componente montar
    useEffect(() => {
        if (!daily || meetingState === 'joined-meeting') return;

        const joinCall = async () => {
            try {
                await daily.join({ 
                    url: conversationUrl,
                    userName: 'Paciente'
                });
            } catch (error) {
                console.error('Erro ao conectar ao Daily:', error);
                onLeave();
            }
        };

        joinCall();

        return () => {
            if (daily) {
                daily.leave().catch(console.error);
            }
        };
    }, [daily, conversationUrl, meetingState, onLeave]);

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
