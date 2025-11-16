'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  VideoTrack,
  useRemoteParticipants,
  useTracks,
  useLocalParticipant,
  useConnectionState
} from '@livekit/components-react';
import { Track, Room, RoomEvent, VideoPresets } from 'livekit-client';
import '@livekit/components-styles';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, MicOff, PhoneOff, WifiOff, AlertTriangle, SwitchCamera } from 'lucide-react';
import {
  useConnectionSupervisor,
  useLiveKitHeartbeat,
  useTokenManager,
  useNetworkQuality,
} from '@/shared/realtime';
import { getCachedToken, clearCachedToken } from '@/lib/livekit-warmup';

interface LiveKitConsultationProps {
  patientId: string;
  patientName: string;
}

// Error message constants
const ERROR_MESSAGES = {
  'device-not-found': 'Câmera ou microfone não encontrados. Você pode continuar apenas com áudio.',
  'permission-denied': 'Permissão negada para câmera/microfone. Verifique as permissões do navegador.',
  'connection-failed': 'Falha ao conectar. Verifique sua conexão de internet.',
  'token-expired': 'Sessão expirada. Reconectando...',
  'network-error': 'Erro de rede. Tentando reconectar...',
  'avatar-failed': 'Avatar não disponível. Continuando apenas com áudio.',
} as const;

// Connection state labels
const CONNECTION_STATE_LABELS = {
  idle: 'Verificando rede...',
  connecting: 'Conectando com MediAI...',
  connected: 'Conectado',
  reconnecting: 'Reconectando...',
  disconnected: 'Desconectado',
  error: 'Erro de conexão',
} as const;

function AvatarVideoDisplay({ audioOnlyMode }: { audioOnlyMode: boolean }) {
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  const avatarTrack = tracks.find(track => 
    track.participant.identity.includes('agent') || 
    track.participant.name?.includes('MediAI')
  );

  if (audioOnlyMode) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Mic className="w-12 h-12 text-white" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold text-white">Modo Somente Áudio</p>
          <p className="text-sm text-slate-400">Avatar não disponível, continuando com áudio</p>
        </div>
      </div>
    );
  }

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
        <p className="text-xl font-semibold text-white">Avatar carregando...</p>
        <p className="text-sm text-slate-400">Aguarde enquanto carregamos sua assistente médica virtual</p>
      </div>
    </div>
  );
}

function CustomControls({ onEndConsultation, room }: { onEndConsultation: () => void; room: Room | null }) {
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  useEffect(() => {
    const loadCameraDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameraDevices(videoDevices);
      } catch (error) {
        console.error('[CustomControls] Failed to enumerate devices:', error);
      }
    };

    loadCameraDevices();

    navigator.mediaDevices.addEventListener('devicechange', loadCameraDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadCameraDevices);
    };
  }, []);

  const toggleMicrophone = async () => {
    if (localParticipant) {
      const enabled = localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(!enabled);
      setIsMuted(!enabled);
    }
  };

  const switchCamera = async () => {
    if (!localParticipant || !room || cameraDevices.length < 2 || isSwitchingCamera) {
      return;
    }

    try {
      setIsSwitchingCamera(true);
      console.log('[CustomControls] Switching camera...');

      const nextIndex = (currentCameraIndex + 1) % cameraDevices.length;
      const nextDevice = cameraDevices[nextIndex];

      console.log('[CustomControls] Next camera:', nextDevice.label, nextDevice.deviceId);

      await localParticipant.setCameraEnabled(true, {
        deviceId: nextDevice.deviceId,
        resolution: VideoPresets.h720.resolution,
      });

      setCurrentCameraIndex(nextIndex);
      console.log('[CustomControls] ✅ Camera switched successfully');
    } catch (error) {
      console.error('[CustomControls] Failed to switch camera:', error);
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  const hasMultipleCameras = cameraDevices.length > 1;

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

        {hasMultipleCameras && (
          <>
            <div className="w-px h-8 bg-slate-600" />
            
            <Button
              onClick={switchCamera}
              variant="secondary"
              size="lg"
              className="rounded-full w-14 h-14 p-0"
              disabled={isSwitchingCamera}
            >
              {isSwitchingCamera ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <SwitchCamera className="w-6 h-6" />
              )}
            </Button>
          </>
        )}

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
  const roomName = `mediai-consultation-${patientId}`;
  
  // Structured logging function
  const logEvent = useCallback((event: string, data?: any) => {
    console.log(`[LiveKitConsultation] ${event}`, {
      timestamp: new Date().toISOString(),
      patientId,
      roomName,
      ...data
    });
  }, [patientId, roomName]);

  // Network quality monitoring
  const { quality: networkQuality, connectionType, isOnline, rtt, downlink } = useNetworkQuality();

  // Token management
  const tokenManager = useTokenManager({
    refreshEndpoint: '/api/livekit/token',
    refreshMarginMs: 60000, // Refresh 1 minute before expiration
    onTokenRefreshed: (newToken: string) => {
      logEvent('Token refreshed', { tokenLength: newToken.length });
    },
    onRefreshError: (error: Error) => {
      logEvent('Token refresh failed', { error: error.message });
    },
  });

  // Connection supervision
  const connectionSupervisor = useConnectionSupervisor({
    maxRetries: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    persistKey: `livekit-consultation-${patientId}`,
    onConnect: () => {
      logEvent('Connection supervisor: connected');
    },
    onDisconnect: () => {
      logEvent('Connection supervisor: disconnected');
    },
    onReconnecting: (attempt: number) => {
      logEvent('Connection supervisor: reconnecting', { attempt });
    },
    onError: (error: Error) => {
      logEvent('Connection supervisor: error', { error: error.message });
    },
  });

  // Component state
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<'checking-network' | 'getting-token' | 'ready'>('checking-network');
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const consultationStartTime = useRef<number | null>(null);
  const hasAttemptedTokenFetch = useRef(false);

  // Heartbeat (only when room is connected)
  const { isHealthy, latency, start: startHeartbeat, stop: stopHeartbeat } = useLiveKitHeartbeat(room);

  // Initial setup: check network and get token
  useEffect(() => {
    if (hasAttemptedTokenFetch.current) return;

    const initializeConsultation = async () => {
      try {
        logEvent('Initializing consultation');
        
        // Step 1: Quick network check (parallel with token fetch for speed)
        setCurrentState('checking-network');
        
        if (!isOnline) {
          throw new Error('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
        }

        // Check for cached token first (instant if available)
        const cached = getCachedToken();
        if (cached) {
          logEvent('Using cached token (instant connection!)');
          tokenManager.setToken(cached.token, cached.url);
          connectionSupervisor.connect();
          setCurrentState('ready');
          consultationStartTime.current = Date.now();
          return;
        }

        // Step 2: Get initial token (immediately, no artificial delay)
        setCurrentState('getting-token');
        logEvent('Fetching initial token');
        
        // Parallel: Get token while checking media permissions (faster)
        const tokenPromise = fetch('/api/livekit/token', {
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
        
        const mediaPromise = navigator.mediaDevices.getUserMedia({ 
          audio: true,
          video: false 
        }).then(stream => {
          stream.getTracks().forEach(track => track.stop());
          logEvent('Media permissions granted');
          return true;
        }).catch((mediaError: any) => {
          logEvent('Media permission error', { error: mediaError.message });
          
          if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            throw new Error(ERROR_MESSAGES['permission-denied']);
          }
          
          // Continue anyway for other media errors
          logEvent('Continuing despite media error');
          return false;
        });

        // Wait for both in parallel (faster)
        const [response] = await Promise.all([tokenPromise, mediaPromise]);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || ERROR_MESSAGES['connection-failed']);
        }

        logEvent('Initial token received', { hasUrl: !!data.url });

        // Set token in token manager for auto-refresh
        tokenManager.setToken(data.token, data.url);
        
        // Mark connection supervisor as connecting
        connectionSupervisor.connect();
        
        setCurrentState('ready');
        consultationStartTime.current = Date.now();

      } catch (err: any) {
        logEvent('Initialization error', { error: err.message });
        setError(err.message || ERROR_MESSAGES['connection-failed']);
        setCurrentState('ready'); // Allow error to show
      }
    };

    hasAttemptedTokenFetch.current = true;
    initializeConsultation();
  }, [isOnline, patientId, patientName, roomName, tokenManager, connectionSupervisor, logEvent]);

  // Track room connection and start heartbeat
  useEffect(() => {
    if (room) {
      logEvent('Room instance created');
      
      const handleConnected = () => {
        logEvent('Room connected event');
        connectionSupervisor.markConnected();
        startHeartbeat();
      };

      const handleDisconnected = () => {
        logEvent('Room disconnected event');
        stopHeartbeat();
      };

      const handleReconnecting = () => {
        logEvent('Room reconnecting event');
      };

      const handleReconnected = () => {
        logEvent('Room reconnected event');
        connectionSupervisor.markConnected();
      };

      room.on(RoomEvent.Connected, handleConnected);
      room.on(RoomEvent.Disconnected, handleDisconnected);
      room.on(RoomEvent.Reconnecting, handleReconnecting);
      room.on(RoomEvent.Reconnected, handleReconnected);

      // Check if already connected
      if (room.state === 'connected') {
        connectionSupervisor.markConnected();
        startHeartbeat();
      }

      return () => {
        room.off(RoomEvent.Connected, handleConnected);
        room.off(RoomEvent.Disconnected, handleDisconnected);
        room.off(RoomEvent.Reconnecting, handleReconnecting);
        room.off(RoomEvent.Reconnected, handleReconnected);
        stopHeartbeat();
      };
    }
  }, [room, connectionSupervisor, startHeartbeat, stopHeartbeat, logEvent]);

  // Monitor heartbeat health
  useEffect(() => {
    if (room && !isHealthy) {
      logEvent('Unhealthy connection detected', { latency });
    }
  }, [isHealthy, latency, room, logEvent]);

  const endConsultation = async () => {
    logEvent('Ending consultation');
    
    // Track consultation duration
    if (consultationStartTime.current) {
      const durationSeconds = Math.floor((Date.now() - consultationStartTime.current) / 1000);
      
      const data = JSON.stringify({
        patientId,
        consultationType: 'ai',
        durationSeconds,
      });
      
      const blob = new Blob([data], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/track-consultation', blob);
      
      if (!sent) {
        try {
          await fetch('/api/track-consultation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
            keepalive: true,
          });
        } catch (error) {
          logEvent('Failed to track consultation', { error });
        }
      }
    }
    
    // Clean up
    connectionSupervisor.disconnect();
    tokenManager.clearToken();
    clearCachedToken();
    
    window.location.href = '/patient/dashboard';
  };

  const getConnectionStateMessage = () => {
    if (currentState === 'checking-network') {
      return 'Verificando rede...';
    }
    if (currentState === 'getting-token') {
      return 'Obtendo acesso...';
    }
    const state = connectionSupervisor.state;
    return state in CONNECTION_STATE_LABELS 
      ? CONNECTION_STATE_LABELS[state as keyof typeof CONNECTION_STATE_LABELS]
      : 'Conectando...';
  };

  // Loading state
  if (currentState !== 'ready') {
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
        <p className="text-slate-300 text-center max-w-md mb-4">
          {getConnectionStateMessage()}
        </p>
        
        {/* Network quality indicator during initialization */}
        {currentState === 'checking-network' && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            {networkQuality === 'excellent' && <span className="text-green-400">✓ Conexão excelente</span>}
            {networkQuality === 'good' && <span className="text-blue-400">✓ Conexão boa</span>}
            {networkQuality === 'poor' && <span className="text-yellow-400">⚠ Conexão instável</span>}
            {networkQuality === 'offline' && <span className="text-red-400">✗ Sem conexão</span>}
          </div>
        )}
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
          <div className="flex gap-3 justify-center">
            {connectionSupervisor.retryCount < 5 && (
              <Button
                onClick={() => {
                  setError(null);
                  hasAttemptedTokenFetch.current = false;
                  setCurrentState('checking-network');
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Tentar Novamente
              </Button>
            )}
            <Button
              onClick={() => window.location.href = '/patient/dashboard'}
              className="bg-slate-700 hover:bg-slate-600"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not ready yet or no token
  if (!tokenManager.token || !tokenManager.url) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex flex-col items-center justify-center z-50">
        <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  // Connected - show LiveKit room
  return (
    <div className="fixed inset-0 bg-slate-900 z-50">
      <LiveKitRoom
        token={tokenManager.token}
        serverUrl={tokenManager.url}
        connect={true}
        audio={{
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }}
        video={{
          deviceId: undefined,
          resolution: VideoPresets.h720.resolution,
        }}
        onConnected={(room?: Room) => {
          logEvent('LiveKitRoom onConnected callback');
          if (room) setRoom(room);
        }}
        onDisconnected={() => {
          logEvent('LiveKitRoom onDisconnected callback');
          endConsultation();
        }}
        onError={(error) => {
          logEvent('LiveKit error', { error: error.message });
          
          // Handle specific error types
          if (error.message.includes('device not found') || 
              error.message.includes('NotFoundError') ||
              error.message.includes('Requested device')) {
            logEvent('Device not found - continuing with audio only');
            return; // Don't show error, continue without video
          }

          // Avatar/video track errors - switch to audio-only mode
          if (error.message.includes('Tavus') || 
              error.message.includes('BEY') || 
              error.message.includes('video track')) {
            logEvent('Avatar failed - switching to audio-only mode');
            setAudioOnlyMode(true);
            return;
          }

          // Connection errors
          if (error.message.includes('connection') || 
              error.message.includes('network')) {
            connectionSupervisor.markFailed(error);
            setError(ERROR_MESSAGES['network-error']);
            return;
          }

          // Token errors
          if (error.message.includes('token') || 
              error.message.includes('unauthorized')) {
            setError(ERROR_MESSAGES['token-expired']);
            tokenManager.refresh();
            return;
          }

          // Generic error
          setError(`Erro de conexão: ${error.message}`);
        }}
        options={{
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
          // Performance optimizations for faster connection
          publishDefaults: {
            videoSimulcastLayers: [VideoPresets.h720],
            stopMicTrackOnMute: false, // Keep mic warm for faster unmute
          },
          // Faster reconnection
          reconnectPolicy: {
            nextRetryDelayInMs: (context) => {
              // Exponential backoff: 1s, 2s, 4s, 8s, max 15s
              return Math.min(1000 * Math.pow(2, context.retryCount), 15000);
            },
          },
        }}
        className="h-full w-full"
      >
        <div className="relative h-full w-full">
          {/* Avatar Video - Full Screen */}
          <AvatarVideoDisplay audioOnlyMode={audioOnlyMode} />

          {/* Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-900/90 to-transparent p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">MediAI</h2>
                <p className="text-sm text-slate-300">
                  {audioOnlyMode ? 'Modo Somente Áudio' : 'Assistente Médica Virtual'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {/* Connection status */}
                <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                  connectionSupervisor.state === 'connected' 
                    ? 'bg-green-500/20 border border-green-500/50'
                    : connectionSupervisor.state === 'reconnecting'
                    ? 'bg-yellow-500/20 border border-yellow-500/50'
                    : 'bg-slate-500/20 border border-slate-500/50'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionSupervisor.state === 'connected'
                      ? 'bg-green-400 animate-pulse'
                      : connectionSupervisor.state === 'reconnecting'
                      ? 'bg-yellow-400 animate-pulse'
                      : 'bg-slate-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    connectionSupervisor.state === 'connected'
                      ? 'text-green-200'
                      : connectionSupervisor.state === 'reconnecting'
                      ? 'text-yellow-200'
                      : 'text-slate-200'
                  }`}>
                    {connectionSupervisor.state in CONNECTION_STATE_LABELS 
                      ? CONNECTION_STATE_LABELS[connectionSupervisor.state as keyof typeof CONNECTION_STATE_LABELS]
                      : 'Conectando'}
                  </span>
                </div>
                
                {/* Latency indicator (when healthy and connected) */}
                {connectionSupervisor.state === 'connected' && latency > 0 && (
                  <div className="text-xs text-slate-400">
                    {latency < 100 ? '🟢' : latency < 200 ? '🟡' : '🔴'} {Math.round(latency)}ms
                  </div>
                )}
              </div>
            </div>

            {/* Network quality warning */}
            {networkQuality === 'poor' && (
              <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 text-sm font-medium">
                      ⚠️ Conexão instável
                    </p>
                    <p className="text-yellow-200 text-xs mt-1">
                      Recomendamos usar WiFi para melhor qualidade.
                      {connectionType !== 'unknown' && ` (Atual: ${connectionType})`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Audio-only mode notice */}
            {audioOnlyMode && (
              <div className="mt-4 bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Mic className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-300 text-sm font-medium">
                      Modo Somente Áudio Ativado
                    </p>
                    <p className="text-blue-200 text-xs mt-1">
                      {ERROR_MESSAGES['avatar-failed']}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Controls */}
          <CustomControls onEndConsultation={endConsultation} room={room} />

          {/* Audio Renderer */}
          <RoomAudioRenderer />
        </div>
      </LiveKitRoom>
    </div>
  );
}
