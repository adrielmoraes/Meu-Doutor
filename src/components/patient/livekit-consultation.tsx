'use client';

import { useState, useEffect } from 'react';
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  VideoTrack,
  useRemoteParticipants,
  useTracks,
  ControlBar,
  useLocalParticipant
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Mic, MicOff, PhoneOff } from 'lucide-react';

interface LiveKitConsultationProps {
  patientId: string;
  patientName: string;
}

function AvatarVideoDisplay() {
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  // Find the avatar's video track
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

  // Show loading state while waiting for avatar
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const roomName = `mediai-consultation-${patientId}`;

  const startConsultation = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Generate LiveKit access token
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
      setIsActive(true);

    } catch (err: any) {
      console.error('Erro ao iniciar consulta:', err);
      setError(err.message || 'Não foi possível iniciar a consulta ao vivo. Por favor, tente novamente.');
    } finally {
      setIsConnecting(false);
    }
  };

  const endConsultation = () => {
    setIsActive(false);
    setToken('');
    setServerUrl('');
  };

  if (!isActive) {
    return (
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Consulta ao Vivo com MediAI
            </CardTitle>
            <CardDescription className="text-slate-300">
              Conecte-se com nossa assistente médica virtual através de vídeo e voz em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-800/30 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-lg text-white">Como funciona:</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">1.</span>
                  <span>Clique em "Iniciar Consulta" para conectar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">2.</span>
                  <span>Permita acesso ao microfone quando solicitado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">3.</span>
                  <span>Converse naturalmente com a MediAI sobre seus sintomas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">4.</span>
                  <span>Receba orientações preliminares e recomendações personalizadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">5.</span>
                  <span>A conversa será transcrita e salva no seu histórico</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                <strong>Importante:</strong> A MediAI tem acesso ao seu histórico médico completo 
                (exames, consultas anteriores, plano de bem-estar) para fornecer orientações 
                mais precisas e personalizadas.
              </p>
            </div>

            <Button
              onClick={startConsultation}
              disabled={isConnecting}
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-5 w-5" />
                  Iniciar Consulta ao Vivo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={false}
        onDisconnected={endConsultation}
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
