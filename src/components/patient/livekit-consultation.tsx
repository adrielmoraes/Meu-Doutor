'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  VideoTrack,
  useRemoteParticipants,
  useTracks,
  useLocalParticipant,
  useConnectionState
} from '@livekit/components-react';
import { Track, RoomConnectOptions, VideoPresets } from 'livekit-client';
import '@livekit/components-styles';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, MicOff, PhoneOff, WifiOff } from 'lucide-react';

interface LiveKitConsultationProps {
  patientId: string;
  patientName: string;
}

function AvatarVideoDisplay() {
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });
  const [showAudioOnly, setShowAudioOnly] = useState(false);

  const avatarTrack = tracks.find(track => 
    track.participant.identity.includes('agent') || 
    track.participant.name?.includes('MediAI')
  );

  // Timeout: Se não houver vídeo após 10 segundos, mostra modo áudio
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!avatarTrack && remoteParticipants.length > 0) {
        console.log('[MediAI] Tavus avatar não disponível - usando modo áudio apenas');
        setShowAudioOnly(true);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timeout);
  }, [avatarTrack, remoteParticipants]);

  // Se há vídeo do avatar, mostra
  if (avatarTrack && avatarTrack.publication) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <VideoTrack 
          trackRef={avatarTrack}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Se detectou participante remoto mas sem vídeo (modo áudio)
  if (showAudioOnly || (remoteParticipants.length > 0 && !avatarTrack)) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-32 h-32 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl">
            <div className="w-24 h-24 bg-gradient-to-br from-white to-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
            </div>
          </div>
          
          <div className="text-center space-y-3">
            <p className="text-2xl font-bold text-white drop-shadow-lg">MediAI está ouvindo</p>
            <p className="text-lg text-white/90">Consulta por áudio conectada</p>
            <p className="text-sm text-white/70 max-w-md mx-auto">
              Fale normalmente - a assistente pode ouvir você e responder
            </p>
          </div>

          {/* Audio wave animation */}
          <div className="flex items-center gap-2 mt-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-white rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 40 + 20}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Aguardando conexão
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 animate-ping opacity-20">
          <div className="w-24 h-24 bg-blue-500 rounded-full"></div>
        </div>
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-xl font-semibold text-white">Conectando com a MediAI...</p>
        <p className="text-sm text-slate-400">Aguarde enquanto carregamos sua assistente médica virtual</p>
      </div>
    </div>
  );
}

function CustomControls({ onEndConsultation }: { onEndConsultation: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);

  const toggleMicrophone = async () => {
    if (localParticipant) {
      const enabled = localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(!enabled);
      setIsMuted(!enabled);
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-slate-800/90 backdrop-blur-lg rounded-full shadow-2xl border border-slate-700 px-6 py-4 flex items-center gap-4">
        <Button
          onClick={toggleMicrophone}
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14 p-0"
        >
          {isMuted ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>

        <div className="w-px h-8 bg-slate-600" />

        <Button
          onClick={onEndConsultation}
          variant="destructive"
          size="lg"
          className="rounded-full px-6"
        >
          <PhoneOff className="w-5 h-5 mr-2" />
          Encerrar
        </Button>
      </div>
    </div>
  );
}

export default function LiveKitConsultation({ patientId, patientName }: LiveKitConsultationProps) {
  const [token, setToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const consultationStartTime = useRef<number | null>(null);
  const roomName = `mediai-consultation-${patientId}`;

  // Auto-start consultation on component mount
  useEffect(() => {
    const startConsultation = async () => {
      try {
        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName,
            participantName: patientName,
            metadata: {
              patient_id: patientId,
              patient_name: patientName,
              session_type: 'medical_consultation'
            }
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao conectar');
        }

        setToken(data.token);
        setServerUrl(data.url);
        setIsConnecting(false);
        
        // Track consultation start time
        consultationStartTime.current = Date.now();

      } catch (err: any) {
        console.error('Erro ao iniciar consulta:', err);
        setError(err.message || 'Não foi possível iniciar a consulta ao vivo.');
        setIsConnecting(false);
      }
    };

    startConsultation();
  }, [patientId, patientName, roomName]);

  const endConsultation = async () => {
    // Track consultation duration usando navigator.sendBeacon para garantir envio
    if (consultationStartTime.current) {
      const durationSeconds = Math.floor((Date.now() - consultationStartTime.current) / 1000);
      
      // Usar sendBeacon para garantir que o request seja enviado mesmo durante navegação
      const data = JSON.stringify({
        patientId,
        consultationType: 'ai',
        durationSeconds,
      });
      
      const blob = new Blob([data], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/track-consultation', blob);
      
      if (!sent) {
        // Fallback: await fetch se sendBeacon falhar
        try {
          await fetch('/api/track-consultation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
            keepalive: true, // Permite request continuar após página fechar
          });
        } catch (error) {
          console.error('[Usage Tracking] Failed to track consultation:', error);
        }
      }
    }
    
    window.location.href = '/patient/dashboard';
  };

  // Loading state
  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex flex-col items-center justify-center z-50">
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-ping opacity-20">
            <div className="w-32 h-32 bg-blue-500 rounded-full"></div>
          </div>
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-white animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Iniciando Consulta ao Vivo</h2>
        <p className="text-slate-300 text-center max-w-md">
          Conectando você com a MediAI...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex flex-col items-center justify-center z-50 p-8">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-300 mb-4">Erro ao Conectar</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <Button
            onClick={() => window.location.href = '/patient/dashboard'}
            className="bg-slate-700 hover:bg-slate-600"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Connected - show LiveKit room
  return (
    <div className="fixed inset-0 bg-slate-900 z-50">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={{
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }}
        video={true}
        onDisconnected={endConsultation}
        onError={(error) => {
          console.error('LiveKit error:', error);
          setError(`Erro de conexão: ${error.message}`);
        }}
        options={{
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
        }}
        className="h-full w-full"
      >
        <div className="relative h-full w-full">
          {/* Avatar Video - Full Screen */}
          <AvatarVideoDisplay />

          {/* Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-900/90 to-transparent p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">MediAI</h2>
                <p className="text-sm text-slate-300">Assistente Médica Virtual</p>
              </div>
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-green-200 font-medium">Conectado</span>
              </div>
            </div>
          </div>

          {/* Custom Controls */}
          <CustomControls onEndConsultation={endConsultation} />

          {/* Audio Renderer */}
          <RoomAudioRenderer />
        </div>
      </LiveKitRoom>
    </div>
  );
}
