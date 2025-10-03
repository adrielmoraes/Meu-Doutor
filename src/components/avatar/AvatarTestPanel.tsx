'use client';

import { useRef, useState } from 'react';
import { TalkingAvatar3D, useAvatarSpeech } from './TalkingAvatar3D';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Square, Mic } from 'lucide-react';

export function AvatarTestPanel() {
  const avatarContainerRef = useRef<HTMLDivElement>(null);
  const { speak, stopSpeaking } = useAvatarSpeech(avatarContainerRef);
  const [text, setText] = useState('Olá! Sou a assistente de IA da MediAI. Como posso ajudar você hoje?');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (!text.trim()) return;
    
    setIsSpeaking(true);
    try {
      await speak(text, {
        mood: 'happy',
        onSubtitles: (subtitle) => console.log('Subtitle:', subtitle)
      });
    } catch (err) {
      console.error('Erro ao falar:', err);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleStop = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  const presetPhrases = [
    'Olá! Bem-vindo à MediAI.',
    'Estou analisando seus exames agora.',
    'Seus resultados parecem normais.',
    'Vou encaminhar você para um especialista.',
    'Cuide-se e tenha um ótimo dia!'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-400">Avatar 3D com TTS</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={avatarContainerRef}>
            <TalkingAvatar3D 
              className="w-full h-96"
              mood="neutral"
              onReady={() => console.log('Avatar pronto para testes')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Controles de Fala
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-cyan-300">Texto para o avatar falar:</label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite o texto aqui..."
              className="bg-slate-800 border-cyan-500/30 text-white"
              disabled={isSpeaking}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSpeak}
              disabled={isSpeaking || !text.trim()}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {isSpeaking ? 'Falando...' : 'Falar'}
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isSpeaking}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Square className="w-4 h-4 mr-2" />
              Parar
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-cyan-300">Frases prontas:</label>
            <div className="flex flex-wrap gap-2">
              {presetPhrases.map((phrase, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="outline"
                  onClick={() => setText(phrase)}
                  disabled={isSpeaking}
                  className="text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                >
                  {phrase.substring(0, 30)}...
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-cyan-500/20">
            <p className="text-xs text-cyan-300/70">
              💡 <strong>Dica:</strong> O avatar usa Gemini 2.5 Flash TTS para gerar voz natural em português 
              com sincronização labial realista usando TalkingHead.js
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
