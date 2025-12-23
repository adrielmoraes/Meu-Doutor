'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LiveKitRoom,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  VideoTrack,
  RoomAudioRenderer,
  useConnectionState,
} from '@livekit/components-react';
import { Track, ConnectionState, ConnectionQuality as LKConnectionQuality } from 'livekit-client';
import '@livekit/components-styles';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Video as VideoIcon, 
  VideoOff,
  Maximize2,
  Minimize2,
  FileText,
  X,
  Clock,
  Wifi,
  WifiOff,
  User,
  Activity,
  ChevronLeft,
  Volume2,
  Save,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DoctorLiveKitCallProps {
  roomName: string;
  doctorName: string;
  patientName: string;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function CallTimer() {
  const [duration, setDuration] = useState(0);
  const connectionState = useConnectionState();

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    
    const interval = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionState]);

  return (
    <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm rounded-full px-4 py-2">
      <Clock className="w-4 h-4 text-cyan-400" />
      <span className="text-white font-mono text-sm">{formatDuration(duration)}</span>
    </div>
  );
}

function ConnectionQualityIndicator() {
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const [quality, setQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');

  useEffect(() => {
    if (!localParticipant) return;

    const updateQuality = () => {
      const lkQuality = localParticipant.connectionQuality;
      switch (lkQuality) {
        case LKConnectionQuality.Excellent:
          setQuality('excellent');
          break;
        case LKConnectionQuality.Good:
          setQuality('good');
          break;
        case LKConnectionQuality.Poor:
          setQuality('poor');
          break;
        default:
          setQuality('unknown');
      }
    };

    updateQuality();
    const interval = setInterval(updateQuality, 2000);
    return () => clearInterval(interval);
  }, [localParticipant]);

  if (connectionState === ConnectionState.Reconnecting) {
    return (
      <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full px-3 py-1.5">
        <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
        <span className="text-xs text-yellow-200">Reconectando...</span>
      </div>
    );
  }

  if (connectionState !== ConnectionState.Connected) {
    return (
      <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full px-3 py-1.5">
        <WifiOff className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-yellow-200">Conectando...</span>
      </div>
    );
  }

  const qualityConfig: Record<string, { bars: number; label: string; containerClass: string; barActiveClass: string; textClass: string }> = {
    excellent: { 
      bars: 4, 
      label: 'Excelente',
      containerClass: 'bg-green-500/20 border border-green-500/50',
      barActiveClass: 'bg-green-400',
      textClass: 'text-green-200'
    },
    good: { 
      bars: 3, 
      label: 'Boa',
      containerClass: 'bg-green-500/20 border border-green-500/50',
      barActiveClass: 'bg-green-400',
      textClass: 'text-green-200'
    },
    poor: { 
      bars: 1, 
      label: 'Fraca',
      containerClass: 'bg-red-500/20 border border-red-500/50',
      barActiveClass: 'bg-red-400',
      textClass: 'text-red-200'
    },
    unknown: { 
      bars: 2, 
      label: 'Verificando',
      containerClass: 'bg-slate-500/20 border border-slate-500/50',
      barActiveClass: 'bg-slate-400',
      textClass: 'text-slate-200'
    },
  };

  const config = qualityConfig[quality];

  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${config.containerClass}`}>
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-full transition-all ${
              bar <= config.bars ? config.barActiveClass : 'bg-slate-600'
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
      <span className={`text-xs ${config.textClass}`}>{config.label}</span>
    </div>
  );
}

function PatientVideoDisplay({ patientName }: { patientName: string }) {
  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  const patientTrack = tracks.find(track => 
    !track.participant.identity.includes('agent') && 
    !track.participant.identity.includes('doctor')
  );

  if (patientTrack && patientTrack.publication) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
        <VideoTrack 
          trackRef={patientTrack}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 left-4 bg-slate-900/70 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">{patientName}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-8">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse">
          <div className="w-40 h-40 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-full blur-xl"></div>
        </div>
        <div className="relative w-32 h-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600">
          <User className="w-16 h-16 text-slate-400" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500/90 rounded-full px-3 py-1">
          <div className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
            <span className="text-xs text-white font-medium">Aguardando</span>
          </div>
        </div>
      </div>
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold text-white">{patientName}</h3>
        <p className="text-slate-400 max-w-md">
          O paciente está sendo notificado sobre a chamada. 
          Aguarde a conexão ser estabelecida.
        </p>
      </div>
      <div className="flex items-center gap-4 text-slate-500 text-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span>Conexão estável</span>
        </div>
        <div className="w-1 h-1 bg-slate-600 rounded-full" />
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          <span>Áudio pronto</span>
        </div>
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
      <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl ring-2 ring-cyan-500/30">
        <VideoTrack 
          trackRef={doctorTrack}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-sm rounded-md px-2 py-1">
          <span className="text-xs text-white">Você</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex flex-col items-center justify-center ring-2 ring-slate-700">
      <VideoOff className="w-10 h-10 text-slate-500 mb-2" />
      <span className="text-xs text-slate-500">Câmera desligada</span>
    </div>
  );
}

function NotesPanel({ isOpen, onClose, roomName }: { isOpen: boolean; onClose: () => void; roomName: string }) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const savedNotes = localStorage.getItem(`consultation-notes-${roomName}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [roomName]);

  useEffect(() => {
    if (!notes) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(`consultation-notes-${roomName}`, notes);
      setLastSaved(new Date());
    }, 1000);
    return () => clearTimeout(timeout);
  }, [notes, roomName]);

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem(`consultation-notes-${roomName}`, notes);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLastSaved(new Date());
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-20 right-4 w-80 bg-slate-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 z-50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Notas da Consulta</h3>
        </div>
        <Button 
          onClick={onClose} 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anote observações importantes durante a consulta..."
          className="min-h-[200px] bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 resize-none focus:ring-cyan-500"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {lastSaved ? (
              <span>Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            ) : (
              <span>{notes.length} caracteres</span>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CallControls({ 
  onEndCall, 
  onToggleNotes,
  isNotesOpen,
  isFullscreen,
  onToggleFullscreen,
}: { 
  onEndCall: () => void;
  onToggleNotes: () => void;
  isNotesOpen: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (localParticipant) {
      setIsMuted(!localParticipant.isMicrophoneEnabled);
      setIsVideoOff(!localParticipant.isCameraEnabled);
    }
  }, [localParticipant]);

  useEffect(() => {
    if (!localParticipant) return;

    const handleTrackMuted = () => {
      setIsMuted(!localParticipant.isMicrophoneEnabled);
      setIsVideoOff(!localParticipant.isCameraEnabled);
    };

    localParticipant.on('trackMuted', handleTrackMuted);
    localParticipant.on('trackUnmuted', handleTrackMuted);
    localParticipant.on('localTrackPublished', handleTrackMuted);
    localParticipant.on('localTrackUnpublished', handleTrackMuted);

    return () => {
      localParticipant.off('trackMuted', handleTrackMuted);
      localParticipant.off('trackUnmuted', handleTrackMuted);
      localParticipant.off('localTrackPublished', handleTrackMuted);
      localParticipant.off('localTrackUnpublished', handleTrackMuted);
    };
  }, [localParticipant]);

  const toggleMicrophone = async () => {
    if (localParticipant) {
      const enabled = localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(!enabled);
      setIsMuted(enabled);
    }
  };

  const toggleCamera = async () => {
    if (localParticipant) {
      const enabled = localParticipant.isCameraEnabled;
      await localParticipant.setCameraEnabled(!enabled);
      setIsVideoOff(enabled);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      <div className="bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-16 pb-6">
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={toggleMicrophone}
            variant="ghost"
            size="icon"
            className={`rounded-full h-14 w-14 transition-all ${
              isMuted 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-2 ring-red-500/50' 
                : 'bg-slate-700/80 text-white hover:bg-slate-600'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          <Button
            onClick={toggleCamera}
            variant="ghost"
            size="icon"
            className={`rounded-full h-14 w-14 transition-all ${
              isVideoOff 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-2 ring-red-500/50' 
                : 'bg-slate-700/80 text-white hover:bg-slate-600'
            }`}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <VideoIcon className="h-6 w-6" />}
          </Button>

          <Button
            onClick={onEndCall}
            variant="ghost"
            size="icon"
            className="rounded-full h-16 w-16 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105"
          >
            <PhoneOff className="h-7 w-7" />
          </Button>

          <Button
            onClick={onToggleNotes}
            variant="ghost"
            size="icon"
            className={`rounded-full h-14 w-14 transition-all ${
              isNotesOpen 
                ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 ring-2 ring-cyan-500/50' 
                : 'bg-slate-700/80 text-white hover:bg-slate-600'
            }`}
          >
            <FileText className="h-6 w-6" />
          </Button>

          <Button
            onClick={onToggleFullscreen}
            variant="ghost"
            size="icon"
            className="rounded-full h-14 w-14 bg-slate-700/80 text-white hover:bg-slate-600 transition-all"
          >
            {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CallInterface({ patientName, roomName, onEndCall }: { patientName: string; roomName: string; onEndCall: () => void }) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      <PatientVideoDisplay patientName={patientName} />

      <div className="absolute top-0 left-0 right-0 z-40">
        <div className="bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-transparent">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={onEndCall}
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10 bg-slate-800/80 text-white hover:bg-slate-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{patientName}</h2>
                    <p className="text-xs text-slate-400">Consulta por Vídeo</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CallTimer />
                <ConnectionQualityIndicator />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-28 right-6 w-64 h-44 z-40 transition-all hover:scale-105">
        <DoctorVideoPreview />
      </div>

      <NotesPanel isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} roomName={roomName} />

      <CallControls 
        onEndCall={onEndCall} 
        onToggleNotes={() => setIsNotesOpen(!isNotesOpen)}
        isNotesOpen={isNotesOpen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      <RoomAudioRenderer />
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

  const fetchToken = useCallback(async () => {
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
  }, [doctorName, roomName]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const endCall = () => {
    router.push('/doctor/schedule');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse">
            <div className="w-32 h-32 bg-gradient-to-br from-cyan-500/30 to-purple-600/30 rounded-full blur-2xl"></div>
          </div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Preparando Chamada</h2>
        <p className="text-slate-400">Conectando à sala de consulta...</p>
        <div className="mt-8 flex items-center gap-6 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <VideoIcon className="w-4 h-4" />
            <span>Verificando câmera</span>
          </div>
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            <span>Testando áudio</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span>Conectando</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-red-400 text-2xl font-bold mb-3">Erro de Conexão</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => router.push('/doctor/schedule')} 
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Voltar para Agenda
            </Button>
          </div>
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
      <CallInterface patientName={patientName} roomName={roomName} onEndCall={endCall} />
    </LiveKitRoom>
  );
}
