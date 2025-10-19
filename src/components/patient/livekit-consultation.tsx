'use client';

import { useState, useEffect } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video } from 'lucide-react';

interface LiveKitConsultationProps {
  patientId: string;
  patientName: string;
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
                  <span>Permita acesso ao microfone e câmera quando solicitado</span>
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
    <div className="h-screen bg-slate-900">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={true}
        onDisconnected={endConsultation}
        className="h-full"
      >
        <div className="h-full flex flex-col">
          {/* Custom Header */}
          <div className="bg-slate-800 border-b border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Consulta ao Vivo - MediAI</h2>
                <p className="text-sm text-slate-400">Assistente médica virtual com IA</p>
              </div>
              <Button 
                onClick={endConsultation}
                variant="destructive"
              >
                Encerrar Consulta
              </Button>
            </div>
          </div>

          {/* Video Conference */}
          <div className="flex-1">
            <VideoConference />
          </div>

          {/* Audio Renderer (handles audio playback) */}
          <RoomAudioRenderer />
        </div>
      </LiveKitRoom>
    </div>
  );
}

