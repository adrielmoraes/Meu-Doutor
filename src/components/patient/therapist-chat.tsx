'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send, Volume2, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { AudioMessage } from './audio-message';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isAudio: boolean;
  audioDataUri?: string;
  timestamp: Date;
};

interface TherapistChatProps {
  patientId: string;
  patientName: string;
}

export default function TherapistChat({ patientId, patientName }: TherapistChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Olá, ${patientName.split(' ')[0]}! Sou sua terapeuta IA e assistente pessoal. Estou aqui para apoiar você em sua jornada de saúde e bem-estar. Como posso ajudar hoje?`,
      isAudio: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  const audioChunks = useRef<Blob[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioStream]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendTextMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      isAudio: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/therapist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          message: inputText,
          isAudioRequest: false,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        isAudio: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar mensagem',
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await processAudioMessage(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioStream(stream);
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao acessar microfone',
        description: 'Verifique as permissões do navegador.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const processAudioMessage = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert blob to data URI for playback
      const reader = new FileReader();
      const userAudioDataUri = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });

      const formData = new FormData();
      formData.append('audio', audioBlob);

      const transcriptionResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      const transcriptionData = await transcriptionResponse.json();

      if (!transcriptionResponse.ok) {
        throw new Error(transcriptionData.error || 'Erro ao transcrever áudio');
      }

      const transcript = transcriptionData.transcript;

      if (!transcript || transcript.trim() === '') {
        throw new Error('Não foi possível transcrever o áudio');
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: transcript,
        isAudio: true,
        audioDataUri: userAudioDataUri, // Save user audio for playback
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      const response = await fetch('/api/therapist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          message: transcript,
          isAudioRequest: true,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar mensagem de voz');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        isAudio: true,
        audioDataUri: data.audioDataUri,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Audio will auto-play via AudioMessage component when user clicks play
      // No need to auto-play here to avoid interrupting user

    } catch (error: any) {
      console.error('Erro ao processar mensagem de voz:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao processar voz',
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-900">
      {/* Header */}
      <div className="bg-green-900/30 backdrop-blur-md border-b border-green-500/20 p-4">
        <div className="flex items-center gap-3">
          <Link href="/patient/dashboard">
            <Button variant="ghost" size="icon" className="text-green-300 hover:text-green-200">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              TA
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-green-100">Terapeuta IA</h2>
            <p className="text-sm text-green-300/70">Assistente pessoal de saúde</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-2xl p-3 ${
                  message.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800/80 text-slate-100'
                } ${message.isAudio ? 'min-w-[300px] max-w-[80%]' : 'max-w-[75%]'}`}
              >
                {message.isAudio && message.audioDataUri ? (
                  // Audio message with WhatsApp-style player
                  <AudioMessage 
                    audioDataUri={message.audioDataUri}
                    isUser={message.role === 'user'}
                    timestamp={formatTime(message.timestamp)}
                  />
                ) : (
                  // Text message
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-green-100/70' : 'text-slate-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-800/80 text-slate-100 rounded-2xl p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-slate-900/50 backdrop-blur-md border-t border-green-500/20 p-4">
        {isRecording ? (
          // Recording indicator (WhatsApp style)
          <div className="flex items-center gap-3 justify-center py-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-red-600 rounded-full h-3 w-3"></div>
              </div>
              <span className="text-red-400 font-medium">Gravando áudio...</span>
            </div>
            <Button
              onClick={stopRecording}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white rounded-full"
            >
              <MicOff className="h-5 w-5 mr-2" />
              Parar
            </Button>
          </div>
        ) : (
          // Normal input
          <div className="flex items-center gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendTextMessage()}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-slate-800/50 border-green-500/20 text-slate-100 placeholder:text-slate-500"
              disabled={isProcessing}
            />
            <Button
              onClick={startRecording}
              size="icon"
              variant="outline"
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              disabled={isProcessing}
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              onClick={sendTextMessage}
              size="icon"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isProcessing || !inputText.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
