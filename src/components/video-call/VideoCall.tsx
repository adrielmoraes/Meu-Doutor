'use client';

import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, Loader2 } from 'lucide-react';

interface VideoCallProps {
  roomId: string;
  userId: string;
  targetId: string;
  isInitiator: boolean;
  onCallEnd: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  roomId,
  userId,
  targetId,
  isInitiator,
  onCallEnd,
}) => {
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Obter stream de mídia
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Criar peer connection
      const newPeer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream,
      });

      newPeer.on('signal', (data) => {
        // Enviar sinalização para o Firebase
        sendSignalToFirebase(data);
      });

      newPeer.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
      });

      newPeer.on('stream', (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      newPeer.on('error', (err) => {
        console.error('Peer error:', err);
        setError('Erro na conexão. Tente novamente.');
        setIsConnecting(false);
      });

      newPeer.on('close', () => {
        setIsConnected(false);
        onCallEnd();
      });

      setPeer(newPeer);

      // Escutar sinais do Firebase
      listenForSignals(newPeer);

    } catch (err) {
      console.error('Erro ao inicializar chamada:', err);
      setError('Não foi possível acessar câmera ou microfone.');
      setIsConnecting(false);
    }
  };

  const sendSignalToFirebase = async (data: any) => {
    try {
      const response = await fetch('/api/webrtc/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          from: userId,
          to: targetId,
          signal: data,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar sinal');
      }
    } catch (error) {
      console.error('Erro ao enviar sinal:', error);
    }
  };

  const listenForSignals = async (peerInstance: SimplePeer.Instance) => {
    try {
      const response = await fetch(`/api/webrtc/listen/${roomId}/${userId}`);
      const reader = response.body?.getReader();
      
      if (reader) {
        const decoder = new TextDecoder();
        const processChunk = async ({ done, value }: any) => {
          if (done) return;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const signal = JSON.parse(line);
                if (signal.from === targetId) {
                  peerInstance.signal(signal.data);
                }
              } catch (e) {
                console.error('Erro ao processar sinal:', e);
              }
            }
          }
          
          reader.read().then(processChunk);
        };
        
        reader.read().then(processChunk);
      }
    } catch (error) {
      console.error('Erro ao escutar sinais:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const endCall = () => {
    if (peer) {
      peer.destroy();
    }
    cleanup();
    onCallEnd();
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peer) {
      peer.destroy();
    }
  };

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={initializeCall} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {isConnecting ? 'Conectando...' : isConnected ? 'Chamada Ativa' : 'Aguardando Conexão'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vídeo Remoto */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Vídeo Local (miniatura) */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {/* Indicadores de Status */}
            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex justify-center gap-4 mt-4">
            <Button
              onClick={toggleAudio}
              variant={isAudioEnabled ? 'outline' : 'destructive'}
              size="icon"
            >
              {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>

            <Button
              onClick={toggleVideo}
              variant={isVideoEnabled ? 'outline' : 'destructive'}
              size="icon"
            >
              {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>

            <Button
              onClick={endCall}
              variant="destructive"
              size="icon"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};