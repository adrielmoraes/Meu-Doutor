'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2 } from 'lucide-react';

interface TavusConsultationClientProps {
  patientId: string;
  patientName: string;
}

export default function TavusConsultationClient({ patientId, patientName }: TavusConsultationClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const startConsultation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tavus/create-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patientName,
          conversationName: `Consulta Virtual - ${patientName}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar consulta');
      }

      setConversationUrl(data.conversationUrl);
      setConversationId(data.conversationId);
      setIsActive(true);

    } catch (err: any) {
      console.error('Erro ao iniciar consulta:', err);
      setError(err.message || 'Erro ao iniciar consulta virtual');
    } finally {
      setIsLoading(false);
    }
  }, [patientId, patientName]);

  const endConsultation = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/tavus/end-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          patientId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao encerrar consulta');
      }

      setTranscript(data.transcript || '');
      setIsActive(false);
      setConversationUrl(null);

      alert('Consulta encerrada com sucesso! Verifique o histórico para ver o resumo.');

    } catch (err: any) {
      console.error('Erro ao encerrar consulta:', err);
      setError(err.message || 'Erro ao encerrar consulta');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, patientId]);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleCamera = () => setIsCameraOff(!isCameraOff);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isActive ? (
        <Card>
          <CardHeader>
            <CardTitle>Consulta Virtual com IA</CardTitle>
            <CardDescription>
              Converse com nossa assistente virtual MediAI através de vídeo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Como funciona:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Converse naturalmente com a assistente virtual</li>
                  <li>• Descreva seus sintomas e preocupações</li>
                  <li>• Receba orientações preliminares imediatas</li>
                  <li>• A conversa será transcrita e analisada</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={startConsultation}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-5 w-5" />
                  Iniciar Consulta Virtual
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Consulta em Andamento</CardTitle>
                <CardDescription>Conectado com MediAI</CardDescription>
              </div>
              <Badge variant="default" className="bg-green-500">
                Ao Vivo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversationUrl && (
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={conversationUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="camera; microphone; autoplay"
                  allowFullScreen
                />
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                onClick={toggleMute}
                className="h-12 w-12 rounded-full"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button
                variant="destructive"
                size="icon"
                onClick={endConsultation}
                disabled={isLoading}
                className="h-14 w-14 rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <PhoneOff className="h-6 w-6" />
                )}
              </Button>

              <Button
                variant={isCameraOff ? "destructive" : "outline"}
                size="icon"
                onClick={toggleCamera}
                className="h-12 w-12 rounded-full"
              >
                {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>
            </div>

            <Alert>
              <AlertDescription className="text-center">
                A conversa está sendo transcrita automaticamente. Ao encerrar, você receberá um resumo completo.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Transcrição da Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {transcript}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}