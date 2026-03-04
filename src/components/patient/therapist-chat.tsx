
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send, ArrowLeft, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { AudioMessage } from './audio-message';
import MediAILogo from '@/components/layout/mediai-logo';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isAudio: boolean;
  audioDataUri?: string;
  timestamp: Date;
  isHistory?: boolean; // Flag for visually differentiating old messages
};

interface TherapistChatProps {
  patientId: string;
  patientName: string;
  initialHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export default function TherapistChat({ patientId, patientName, initialHistory = [] }: TherapistChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const audioChunks = useRef<Blob[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadedMessages: Message[] = [];

    // Load persisted history
    if (initialHistory.length > 0) {
      for (let i = 0; i < initialHistory.length; i++) {
        loadedMessages.push({
          id: `history-${i}`,
          role: initialHistory[i].role,
          content: initialHistory[i].content,
          isAudio: false,
          timestamp: new Date(), // We don't have exact timestamps from history
          isHistory: true,
        });
      }
    }

    // Always add the greeting at the end
    loadedMessages.push({
      id: 'greeting',
      role: 'assistant',
      content: initialHistory.length > 0
        ? `Olá novamente, ${patientName.split(' ')[0]}! Que bom te ver de volta. Lembro da nossa conversa anterior. Como posso te ajudar hoje?`
        : `Olá, ${patientName.split(' ')[0]}! Sou sua terapeuta IA e assistente pessoal. Estou aqui para apoiar você em sua jornada de saúde e bem-estar. Como posso ajudar hoje?`,
      isAudio: false,
      timestamp: new Date(),
    });

    setMessages(loadedMessages);
  }, [patientName, initialHistory]);

  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioStream]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Helper function to simulate human-like typing
  const simulateTypingAndSend = async (fullText: string, audioUri?: string) => {
    // 1. Split text into chunks (sentences)
    const rawChunks = fullText.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [fullText];

    // Merge very short chunks with previous ones to avoid weird pacing
    const chunks: string[] = [];
    let currentChunk = "";

    for (const chunk of rawChunks) {
      if ((currentChunk + chunk).length < 20 && chunks.length > 0) {
        currentChunk += chunk;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = chunk;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    // 2. Send chunks sequentially
    setIsProcessing(true);

    for (let i = 0; i < chunks.length; i++) {
      const textChunk = chunks[i].trim();
      if (!textChunk) continue;

      const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
      await new Promise(resolve => setTimeout(resolve, delay));

      const assistantMessage: Message = {
        id: (Date.now() + i).toString(),
        role: 'assistant',
        content: textChunk,
        isAudio: i === chunks.length - 1 && !!audioUri,
        audioDataUri: (i === chunks.length - 1) ? audioUri : undefined,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  // Build the conversation context for the API (current session + history)
  const getConversationContext = () => {
    return messages
      .filter(m => m.id !== 'greeting') // Don't send the greeting as context
      .map(m => ({
        role: m.role,
        content: m.content,
      }));
  };

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
          conversationHistory: getConversationContext(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      await simulateTypingAndSend(data.response);

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
        audioDataUri: userAudioDataUri,
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
          conversationHistory: getConversationContext(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar mensagem de voz');
      }

      if (data.audioDataUri) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Mensagem de voz',
          isAudio: true,
          audioDataUri: data.audioDataUri,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        await simulateTypingAndSend(data.response, data.audioDataUri);
      }

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

  // Find the index where history ends and new messages begin
  const historyEndIndex = messages.findLastIndex(m => m.isHistory);
  const hasHistory = historyEndIndex >= 0;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border shadow-sm p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-3 max-w-6xl mx-auto">
          <Link href="/patient/dashboard">
            <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 shrink-0">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </Link>
          <MediAILogo size="md" showText={true} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm md:text-lg font-semibold text-foreground truncate">Terapeuta IA</h2>
            <p className="text-xs md:text-sm text-muted-foreground truncate">Assistente pessoal de saúde</p>
          </div>
          {hasHistory && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              <History className="h-3 w-3" />
              <span className="hidden sm:inline">{initialHistory.length} msgs salvas</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollAreaRef}>
        <div className="space-y-3 md:space-y-4 max-w-4xl mx-auto">
          {/* History separator */}
          {hasHistory && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium px-2 flex items-center gap-1.5">
                <History className="h-3 w-3" />
                Conversas anteriores
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {messages.map((message, index) => (
            <div key={message.id}>
              {/* Separator between history and new messages */}
              {hasHistory && index === historyEndIndex + 1 && !message.isHistory && (
                <div className="flex items-center gap-3 py-3 mb-3">
                  <div className="flex-1 h-px bg-primary/30" />
                  <span className="text-xs text-primary font-semibold px-2">Sessão atual</span>
                  <div className="flex-1 h-px bg-primary/30" />
                </div>
              )}
              <div
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${message.isHistory ? 'opacity-70' : ''}`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 shadow-md ${message.role === 'user'
                    ? 'bg-gradient-to-br from-pink-500 to-pink-600 dark:from-primary dark:to-primary/90 text-white'
                    : 'bg-card text-foreground border border-border'
                    } ${message.isAudio ? 'min-w-[250px] max-w-[85%] md:min-w-[300px] md:max-w-[80%]' : 'max-w-[85%] md:max-w-[75%]'}`}
                >
                  {message.isAudio && message.audioDataUri ? (
                    <AudioMessage
                      audioDataUri={message.audioDataUri}
                      isUser={message.role === 'user'}
                      timestamp={formatTime(message.timestamp)}
                    />
                  ) : (
                    <div className="flex-1">
                      <p className="text-[15px] md:text-[17px] leading-[1.4] whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`text-[11px] md:text-xs mt-1.5 ${message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                        {message.isHistory ? 'sessão anterior' : formatTime(message.timestamp)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-card text-foreground border border-border rounded-2xl px-4 py-3 shadow-md">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" style={{ animationDelay: '200ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" style={{ animationDelay: '400ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-card/80 backdrop-blur-md border-t border-border shadow-lg p-3 md:p-4">
        <div className="max-w-4xl mx-auto">
          {isRecording ? (
            <div className="flex items-center gap-2 md:gap-3 justify-center py-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-red-600 rounded-full h-3 w-3"></div>
                </div>
                <span className="text-red-500 dark:text-red-400 font-medium text-sm md:text-base">Gravando áudio...</span>
              </div>
              <Button
                onClick={stopRecording}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white rounded-full"
              >
                <MicOff className="h-4 w-4 md:h-5 md:w-5 md:mr-2" />
                <span className="hidden md:inline">Parar</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendTextMessage()}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground text-[15px] md:text-[17px] py-3"
                disabled={isProcessing}
              />
              <Button
                onClick={startRecording}
                size="icon"
                variant="outline"
                className="border-border text-primary hover:bg-accent shrink-0"
                disabled={isProcessing}
              >
                <Mic className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button
                onClick={sendTextMessage}
                size="icon"
                className="bg-gradient-to-br from-pink-500 to-pink-600 dark:from-primary dark:to-primary/90 hover:from-pink-600 hover:to-pink-700 dark:hover:from-primary/90 dark:hover:to-primary text-white shrink-0"
                disabled={isProcessing || !inputText.trim()}
              >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
