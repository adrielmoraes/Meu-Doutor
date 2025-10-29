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

  const avatarTrack = tracks.find(track => 
    track.participant.identity.includes('agent') || 
    track.participant.name?.includes('MediAI')
  );

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
        // Primeiro, verificar permissões de mídia
        console.log('[MediAI] Solicitando permissões de mídia...');
        
        try {
          // Tentar obter permissão de microfone
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true,
            video: false // Não exigir vídeo
          });
          
          // Parar a stream depois de conseguir permissão
          stream.getTracks().forEach(track => track.stop());
          console.log('[MediAI] Permissões de mídia concedidas');
        } catch (mediaError: any) {
          console.error('[MediAI] Erro ao acessar mídia:', mediaError);
          
          // Se o erro for de permissão negada, mostrar mensagem clara
          if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            throw new Error('Por favor, permita o acesso ao microfone para iniciar a consulta.');
          }
          
          // Outros erros de mídia - tentar continuar mesmo assim
          console.warn('[MediAI] Continuando apesar do erro de mídia:', mediaError.message);
        }
        
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
        video={{
          deviceId: undefined, // Deixa o browser escolher
          resolution: VideoPresets.h720.resolution,
        }}
        onDisconnected={endConsultation}
        onError={(error) => {
          console.error('LiveKit error:', error);
          // Ignora erros de dispositivo não encontrado (usuário pode não ter câmera)
          if (error.message.includes('device not found') || 
              error.message.includes('NotFoundError') ||
              error.message.includes('Requested device')) {
            console.warn('Dispositivo de vídeo não encontrado - continuando apenas com áudio');
            return; // Não mostra erro, continua sem vídeo
          }
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
