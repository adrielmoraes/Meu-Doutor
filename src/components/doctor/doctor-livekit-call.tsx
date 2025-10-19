'use client';

import { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  VideoTrack,
  AudioTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, MicOff, PhoneOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DoctorLiveKitCallProps {
  roomName: string;
  doctorName: string;
  patientName: string;
}

function PatientVideoDisplay() {
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  const patientTrack = tracks.find(track => 
    !track.participant.identity.includes('agent') && 
    !track.participant.identity.includes('doctor')
  );

  if (patientTrack && patientTrack.publication) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <VideoTrack 
          trackRef={patientTrack}
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
        <p className="text-xl font-semibold text-white">Aguardando paciente...</p>
        <p className="text-sm text-slate-400">O paciente está se conectando à chamada</p>
      </div>
    </div>
  );
}

function DoctorVideoPreview() {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });

  const doctorTrack = tracks.find(track => 
    track.participant.identity.includes('doctor') ||
    track.participant === localParticipant
  );

  if (doctorTrack && doctorTrack.publication) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-2xl border-2 border-cyan-500/50">
        <VideoTrack 
          trackRef={doctorTrack}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center">
      <VideoIcon className="w-12 h-12 text-slate-600" />
    </div>
  );
}

function CallControls({ onEndCall }: { onEndCall: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const toggleMicrophone = async () => {
    if (localParticipant) {
      const enabled = localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(!enabled);
      setIsMuted(!enabled);
    }
  };

  const toggleCamera = async () => {
    if (localParticipant) {
      const enabled = localParticipant.isCameraEnabled;
      await localParticipant.setCameraEnabled(!enabled);
      setIsVideoOff(!enabled);
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-slate-800/90 backdrop-blur-lg rounded-full shadow-2xl border border-slate-700 px-6 py-4 flex items-center gap-4">
        <Button
          onClick={toggleMicrophone}
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full h-12 w-12"
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          onClick={toggleCamera}
          variant={isVideoOff ? "destructive" : "secondary"}
          size="icon"
          className="rounded-full h-12 w-12"
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
        </Button>

        <Button
          onClick={onEndCall}
          variant="destructive"
          size="icon"
          className="rounded-full h-14 w-14 bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

function CallInterface({ patientName, onEndCall }: { patientName: string; onEndCall: () => void }) {
  return (
    <div className="relative w-full h-screen bg-slate-900">
      <PatientVideoDisplay />

      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-900/90 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{patientName}</h2>
            <p className="text-sm text-slate-300">Consulta em andamento</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-200 font-medium">Conectado</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-32 right-8 w-72 h-48 z-40">
        <DoctorVideoPreview />
      </div>

      <CallControls onEndCall={onEndCall} />

      <AudioTrack />
    </div>
  );
}

export default function DoctorLiveKitCall({ 
  roomName, 
  doctorName, 
  patientName 
}: DoctorLiveKitCallProps) {
  const [token, setToken] = useState<string>('');
  const [livekitUrl, setLivekitUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = async () => {
    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantName: `doctor-${doctorName}`,
          metadata: {
            role: 'doctor',
            name: doctorName,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao obter token LiveKit');
      }

      const data = await response.json();
      setToken(data.token);
      setLivekitUrl(data.url);
    } catch (err: any) {
      console.error('Erro ao obter token:', err);
      setError('Não foi possível conectar à sala de chamada. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = () => {
    router.push('/doctor/schedule');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mb-4" />
        <p className="text-white text-lg">Conectando à chamada...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 text-xl font-bold mb-2">Erro de Conexão</h2>
          <p className="text-white mb-4">{error}</p>
          <Button onClick={() => router.push('/doctor/schedule')} variant="outline">
            Voltar para Agenda
          </Button>
        </div>
      </div>
    );
  }

  if (!token || !livekitUrl) {
    return null;
  }

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={token}
      connect={true}
      video={true}
      audio={true}
    >
      <CallInterface patientName={patientName} onEndCall={endCall} />
    </LiveKitRoom>
  );
}
