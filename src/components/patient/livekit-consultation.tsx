'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  VideoTrack,
  useRemoteParticipants,
  useTracks,
  useLocalParticipant,
  useConnectionState,
  useRoomContext
} from '@livekit/components-react';
import { Track, Room, RoomEvent, VideoPresets } from 'livekit-client';
import '@livekit/components-styles';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, MicOff, PhoneOff, WifiOff, AlertTriangle, SwitchCamera, Clock } from 'lucide-react';
import {
  useConnectionSupervisor,
  useLiveKitHeartbeat,
  useTokenManager,
  useNetworkQuality,
} from '@/shared/realtime';
import { getCachedToken, clearCachedToken, clearConnectionState, cleanupRoom } from '@/lib/livekit-warmup';

interface LiveKitConsultationProps {
  patientId: string;
  patientName: string;
  availableMinutes?: number;
  usedMinutes?: number;
  totalMinutes?: number;
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

interface RoomConnectionHandlerProps {
  onRoomReady: (room: Room) => void;
  onConnectionChange: (connected: boolean) => void;
}

function RoomConnectionHandler({ onRoomReady, onConnectionChange }: RoomConnectionHandlerProps) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (room && connectionState === 'connected' && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      console.log('[RoomConnectionHandler] Room connected, notifying parent');
      onRoomReady(room);
      onConnectionChange(true);
    } else if (connectionState === 'disconnected') {
      hasNotifiedRef.current = false;
      onConnectionChange(false);
    } else if (connectionState === 'reconnecting') {
      onConnectionChange(false);
    }
  }, [room, connectionState, onRoomReady, onConnectionChange]);

  return null;
}

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
  const [cameraNotification, setCameraNotification] = useState<string | null>(null);

  // Determine if current camera is front or back based on label
  const getCurrentCameraType = (index: number): 'front' | 'back' | 'unknown' => {
    if (cameraDevices.length === 0) return 'unknown';
    const device = cameraDevices[index];
    const label = device?.label?.toLowerCase() || '';
    
    // Common patterns for front/back camera detection
    if (label.includes('front') || label.includes('frontal') || label.includes('user') || label.includes('facetime')) {
      return 'front';
    }
    if (label.includes('back') || label.includes('rear') || label.includes('traseira') || label.includes('environment')) {
      return 'back';
    }
    // Default: first camera is usually front, second is back
    return index === 0 ? 'front' : 'back';
  };

  const getCameraLabel = (type: 'front' | 'back' | 'unknown'): string => {
    switch (type) {
      case 'front': return 'Câmera Frontal';
      case 'back': return 'Câmera Traseira';
      default: return 'Câmera';
    }
  };

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

  // Auto-hide camera notification after 2 seconds
  useEffect(() => {
    if (cameraNotification) {
      const timer = setTimeout(() => {
        setCameraNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [cameraNotification]);

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
      
      // Show notification with camera type
      const cameraType = getCurrentCameraType(nextIndex);
      const cameraLabel = getCameraLabel(cameraType);
      setCameraNotification(cameraLabel);
      
      console.log('[CustomControls] ✅ Camera switched successfully to:', cameraLabel);
    } catch (error) {
      console.error('[CustomControls] Failed to switch camera:', error);
      setCameraNotification('Erro ao trocar câmera');
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  const hasMultipleCameras = cameraDevices.length > 1;
  const currentCameraType = getCurrentCameraType(currentCameraIndex);

  return (
    <>
      {/* Camera switch notification toast */}
      {cameraNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-slate-800/95 backdrop-blur-lg rounded-full shadow-2xl border border-slate-600 px-5 py-3 flex items-center gap-3">
            <SwitchCamera className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium text-sm">
              {cameraNotification}
            </span>
          </div>
        </div>
      )}
      
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
              
              {/* Camera button with current camera indicator */}
              <div className="relative">
                <Button
                  onClick={switchCamera}
                  variant="secondary"
                  size="lg"
                  className="rounded-full w-14 h-14 p-0"
                  disabled={isSwitchingCamera}
                  title={`Câmera atual: ${getCameraLabel(currentCameraType)}. Clique para trocar.`}
                >
                  {isSwitchingCamera ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <SwitchCamera className="w-6 h-6" />
                  )}
                </Button>
                {/* Small indicator showing current camera type */}
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-800">
                  {currentCameraType === 'front' ? 'F' : currentCameraType === 'back' ? 'T' : '?'}
                </div>
              </div>
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
    </>
  );
}

export default function LiveKitConsultation({ 
  patientId, 
  patientName,
  availableMinutes,
  usedMinutes,
  totalMinutes 
}: LiveKitConsultationProps) {
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
  const [isRoomConnected, setIsRoomConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<'checking-network' | 'getting-token' | 'ready'>('checking-network');
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const consultationStartTime = useRef<number | null>(null);
  const hasAttemptedTokenFetch = useRef(false);
  const isEndingRef = useRef(false);
  
  // Time limit state - convert available minutes to seconds
  // Compute initial remaining time based on props (uses totalMinutes as fallback)
  const computeRemainingSeconds = (avail?: number, used?: number, total?: number): number | null => {
    // Use availableMinutes if defined, otherwise fall back to totalMinutes
    const effectiveMinutes = avail !== undefined ? avail : total;
    
    // Unlimited plans have no timer
    if (effectiveMinutes === undefined || effectiveMinutes === Infinity) return null;
    
    // If we have used minutes info, compute remaining from server state
    if (used !== undefined) {
      const remaining = Math.max(0, effectiveMinutes - used);
      return Math.floor(remaining * 60);
    }
    // Otherwise use effective minutes directly
    return Math.floor(effectiveMinutes * 60);
  };
  
  const initialRemainingSeconds = computeRemainingSeconds(availableMinutes, usedMinutes, totalMinutes);
  const initiallyExpired = initialRemainingSeconds !== null && initialRemainingSeconds <= 0;
  
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(initialRemainingSeconds);
  const [showTimeWarning, setShowTimeWarning] = useState(initiallyExpired);
  const [timeExpired, setTimeExpired] = useState(initiallyExpired);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartedRef = useRef(false);
  const disconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to track state inside interval callback (avoid stale closures)
  const showTimeWarningRef = useRef(showTimeWarning);
  const timeExpiredRef = useRef(timeExpired);
  const availableMinutesRef = useRef(availableMinutes);
  const totalMinutesRef = useRef(totalMinutes);
  
  // Keep refs in sync with state
  useEffect(() => { showTimeWarningRef.current = showTimeWarning; }, [showTimeWarning]);
  useEffect(() => { timeExpiredRef.current = timeExpired; }, [timeExpired]);
  useEffect(() => { availableMinutesRef.current = availableMinutes; }, [availableMinutes]);
  useEffect(() => { totalMinutesRef.current = totalMinutes; }, [totalMinutes]);

  // Heartbeat (only when room is connected)
  const { isHealthy, latency, start: startHeartbeat, stop: stopHeartbeat } = useLiveKitHeartbeat(room);

  // Initial setup: check network and get token
  useEffect(() => {
    if (hasAttemptedTokenFetch.current) return;

    const initializeConsultation = async () => {
      try {
        logEvent('Initializing consultation');
        
        // Step 0: Clear any stale connection state from previous sessions
        clearConnectionState(patientId);
        
        // Step 1: Quick network check (parallel with token fetch for speed)
        setCurrentState('checking-network');
        
        if (!isOnline) {
          throw new Error('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
        }

        // Cleanup any previous room before starting new connection
        // This must complete before we request a new token to prevent race conditions
        try {
          await cleanupRoom(patientId);
          logEvent('Previous room cleanup completed');
        } catch (err) {
          logEvent('Previous room cleanup failed (continuing anyway)');
        }
        
        // Clear any cached token since we cleaned up the room
        clearCachedToken();

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

      } catch (err: any) {
        logEvent('Initialization error', { error: err.message });
        setError(err.message || ERROR_MESSAGES['connection-failed']);
        setCurrentState('ready'); // Allow error to show
      }
    };

    hasAttemptedTokenFetch.current = true;
    initializeConsultation();
  }, [isOnline, patientId, patientName, roomName, tokenManager, connectionSupervisor, logEvent]);

  // Callbacks for RoomConnectionHandler (useCallback to avoid re-renders)
  const handleRoomReady = useCallback((newRoom: Room) => {
    logEvent('RoomConnectionHandler: Room ready');
    setRoom(newRoom);
    if (!consultationStartTime.current) {
      consultationStartTime.current = Date.now();
    }
    connectionSupervisor.markConnected();
    // Note: startHeartbeat is called in the useEffect when room is set
  }, [logEvent, connectionSupervisor]);

  const handleConnectionChange = useCallback((connected: boolean) => {
    logEvent('RoomConnectionHandler: Connection change', { connected });
    setIsRoomConnected(connected);
    // Note: stopHeartbeat is handled in the useEffect when room disconnects
  }, [logEvent]);

  // Track room connection and start heartbeat
  useEffect(() => {
    if (room) {
      logEvent('Room instance created');
      
      const handleConnected = () => {
        logEvent('Room connected event - starting timer');
        setIsRoomConnected(true);
        if (!consultationStartTime.current) {
          consultationStartTime.current = Date.now();
        }
        connectionSupervisor.markConnected();
        startHeartbeat();
      };

      const handleDisconnected = () => {
        logEvent('Room disconnected event');
        setIsRoomConnected(false);
        stopHeartbeat();
      };

      const handleReconnecting = () => {
        logEvent('Room reconnecting event');
        setIsRoomConnected(false);
      };

      const handleReconnected = () => {
        logEvent('Room reconnected event');
        setIsRoomConnected(true);
        connectionSupervisor.markConnected();
      };

      room.on(RoomEvent.Connected, handleConnected);
      room.on(RoomEvent.Disconnected, handleDisconnected);
      room.on(RoomEvent.Reconnecting, handleReconnecting);
      room.on(RoomEvent.Reconnected, handleReconnected);

      // Check if already connected (room was passed already connected)
      if (room.state === 'connected') {
        logEvent('Room already connected on mount - starting timer');
        setIsRoomConnected(true);
        if (!consultationStartTime.current) {
          consultationStartTime.current = Date.now();
        }
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

  // Track previous prop values to detect changes
  const prevAvailableMinutesRef = useRef(availableMinutes);
  const prevUsedMinutesRef = useRef(usedMinutes);
  const prevTotalMinutesRef = useRef(totalMinutes);
  
  // Reset timer state when quota props change (admin updated, plan changed, or backend syncs)
  useEffect(() => {
    const availableChanged = availableMinutes !== prevAvailableMinutesRef.current;
    const usedChanged = usedMinutes !== prevUsedMinutesRef.current;
    const totalChanged = totalMinutes !== prevTotalMinutesRef.current;
    
    if (availableChanged || usedChanged || totalChanged) {
      // FIRST: Clear existing interval SYNCHRONOUSLY before any state updates
      // This ensures no extra ticks fire during plan upgrade to unlimited
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      timerStartedRef.current = false;
      
      // Also cancel any pending disconnect timeout (e.g., if quota was restored)
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;
      }
      
      // Update refs
      prevAvailableMinutesRef.current = availableMinutes;
      prevUsedMinutesRef.current = usedMinutes;
      prevTotalMinutesRef.current = totalMinutes;
      
      const newRemainingSeconds = computeRemainingSeconds(availableMinutes, usedMinutes, totalMinutes);
      
      // Check if already expired (0 seconds remaining)
      const alreadyExpired = newRemainingSeconds !== null && newRemainingSeconds <= 0;
      
      // Reset all timer state
      setRemainingSeconds(newRemainingSeconds);
      setShowTimeWarning(alreadyExpired && newRemainingSeconds === 0); // Only show warning if expired at 0
      
      // IMPORTANT: Only set timeExpired to true if remaining is EXACTLY 0 or negative
      // AND we are not transitioning from expired to valid
      if (alreadyExpired) {
         setTimeExpired(true);
      } else {
         // If we have time now, ensure we clear the expired flag!
         setTimeExpired(false);
         // Also clear any pending disconnect timeout
         if (disconnectTimeoutRef.current) {
            clearTimeout(disconnectTimeoutRef.current);
            disconnectTimeoutRef.current = null;
         }
      }
      
      logEvent('Time limit reset due to prop change', { 
        availableMinutes, 
        usedMinutes,
        totalMinutes,
        newRemainingSeconds,
        isUnlimited: newRemainingSeconds === null,
        alreadyExpired,
        clearedExpired: !alreadyExpired
      });
    }
  }, [availableMinutes, usedMinutes, totalMinutes, logEvent]);

  // Time limit countdown timer - only starts/stops based on connection state
  // Does NOT depend on remainingSeconds to avoid recreating interval every tick
  useEffect(() => {
    const clearTimer = () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };

    // Use availableMinutes if defined, otherwise fall back to totalMinutes
    const effectiveMinutes = availableMinutes !== undefined ? availableMinutes : totalMinutes;
    const hasTimeLimit = effectiveMinutes !== undefined && effectiveMinutes !== Infinity;

    logEvent('Timer effect running', {
      isRoomConnected,
      hasTimeLimit,
      effectiveMinutes,
      timeExpired,
      timerStarted: timerStartedRef.current
    });

    // If not connected, no time limit, or already expired, clear timer
    if (!isRoomConnected || !hasTimeLimit || timeExpired) {
      clearTimer();
      timerStartedRef.current = false;
      return;
    }

    // If timer is already running, don't recreate
    if (timerStartedRef.current && timerIntervalRef.current) {
      return;
    }

    // Start the timer
    timerStartedRef.current = true;
    logEvent('Starting time limit countdown', { 
      effectiveMinutes,
      remainingSeconds
    });

    // Timer tick function
    const timerTick = () => {
      // Check if plan changed to unlimited during interval (instant halt)
      const currentAvail = availableMinutesRef.current;
      const currentTotal = totalMinutesRef.current;
      const effectiveMinutes = currentAvail !== undefined ? currentAvail : currentTotal;
      
      if (effectiveMinutes === undefined || effectiveMinutes === Infinity) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          timerStartedRef.current = false;
        }
        return;
      }
      
      setRemainingSeconds(prev => {
        // Guard against null
        if (prev === null) {
          return null;
        }
        
        // Already at or below 0 - ensure expiration is triggered and return 0
        if (prev <= 0) {
          if (!timeExpiredRef.current) {
            setTimeExpired(true);
          }
          return 0;
        }
        
        const newValue = Math.max(0, prev - 1);
        
        // Show warning when 60 seconds remaining (use ref to avoid stale closure)
        if (newValue === 60 && !showTimeWarningRef.current) {
          setShowTimeWarning(true);
        }
        
        // Time expired - only trigger once (use ref to avoid stale closure)
        if (newValue === 0 && !timeExpiredRef.current) {
          setTimeExpired(true);
        }
        
        return newValue;
      });
    };

    // Start interval for continuous countdown (every second)
    timerIntervalRef.current = setInterval(timerTick, 1000);

    return clearTimer;
  }, [isRoomConnected, availableMinutes, totalMinutes, timeExpired, remainingSeconds, logEvent]);

  const endConsultation = useCallback(async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    logEvent('Ending consultation');
    
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
    
    connectionSupervisor.disconnect();
    tokenManager.clearToken();
    clearCachedToken();
    clearConnectionState(patientId);
    
    cleanupRoom(patientId).catch((error) => {
      logEvent('Room cleanup failed (non-blocking)', { error });
    });
    
    window.location.href = '/patient/dashboard';
  }, [connectionSupervisor, logEvent, patientId, tokenManager]);

  // Handle time expired - end consultation
  useEffect(() => {
    // If time expired and we have a room, disconnect regardless of supervisor state
    if (timeExpired && room) {
      try {
        logEvent('Time expired - forcing disconnection');
        room.disconnect();
      } catch (error) {
        logEvent('Failed to disconnect room on time expiry', { error });
      }

      disconnectTimeoutRef.current = setTimeout(() => {
        endConsultation();
      }, 5000); // 5 seconds to show "time expired" message

      return () => {
        if (disconnectTimeoutRef.current) {
          clearTimeout(disconnectTimeoutRef.current);
          disconnectTimeoutRef.current = null;
        }
      };
    }
  }, [timeExpired, room, endConsultation, logEvent]);

  // Helper to format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // Time expired state - shown when consultation time runs out
  if (timeExpired) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex flex-col items-center justify-center z-50 p-8">
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-8 max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-amber-500/30 p-4 rounded-full">
              <Clock className="w-16 h-16 text-amber-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-amber-300 mb-4">Tempo Esgotado</h2>
          <p className="text-amber-200 mb-6">
            Seu tempo de consulta com IA terminou. A consulta está sendo encerrada automaticamente.
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            <span className="text-amber-300 text-sm">Encerrando consulta...</span>
          </div>
          <p className="text-slate-400 text-sm">
            Você pode adquirir mais minutos fazendo upgrade do seu plano.
          </p>
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
        onConnected={() => {
          logEvent('LiveKitRoom onConnected callback');
        }}
        onDisconnected={() => {
          logEvent('LiveKitRoom onDisconnected callback');
          if (timeExpiredRef.current) return;
          if (isEndingRef.current) return;
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
        {/* Connection handler - uses hooks to detect room state */}
        <RoomConnectionHandler 
          onRoomReady={handleRoomReady} 
          onConnectionChange={handleConnectionChange} 
        />
        
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

                {/* Time remaining countdown indicator */}
                {remainingSeconds !== null ? (
                  <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                    remainingSeconds > 120 
                      ? 'bg-blue-500/20 border border-blue-500/50'
                      : remainingSeconds > 60
                      ? 'bg-yellow-500/20 border border-yellow-500/50'
                      : 'bg-red-500/20 border border-red-500/50 animate-pulse'
                  }`}>
                    <Clock className={`w-4 h-4 ${
                      remainingSeconds > 120
                        ? 'text-blue-400'
                        : remainingSeconds > 60
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`} />
                    <span className={`text-sm font-bold tabular-nums ${
                      remainingSeconds > 120
                        ? 'text-blue-200'
                        : remainingSeconds > 60
                        ? 'text-yellow-200'
                        : 'text-red-200'
                    }`}>
                      {formatTime(remainingSeconds)}
                    </span>
                  </div>
                ) : totalMinutes === Infinity ? (
                  <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-green-500/20 border border-green-500/50">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-200">
                      Tempo ilimitado
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Time warning banner - shown when 60 seconds remaining */}
            {showTimeWarning && remainingSeconds !== null && remainingSeconds <= 60 && remainingSeconds > 0 && (
              <div className="mt-4 bg-red-500/30 border border-red-500/50 rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/30 p-2 rounded-full">
                    <Clock className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-red-200 font-bold text-lg">
                      Tempo acabando: {formatTime(remainingSeconds)}
                    </p>
                    <p className="text-red-300 text-sm">
                      Sua consulta será encerrada automaticamente quando o tempo expirar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Network quality warning */}
            {networkQuality === 'poor' && (
              <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 text-sm font-medium">
                      Conexao instavel
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
