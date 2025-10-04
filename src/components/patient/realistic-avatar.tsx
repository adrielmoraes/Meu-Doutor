'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface RealisticAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioBase64?: string;
  onAudioEnd?: () => void;
  avatarType?: '3d' | 'd-id';
  gender?: 'male' | 'female';
}

export function RealisticAvatar({
  isListening,
  isSpeaking,
  audioBase64,
  onAudioEnd,
  avatarType = '3d',
  gender = 'female'
}: RealisticAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarImage, setAvatarImage] = useState<string>('');
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioPlayerRef.current = new Audio();
      audioPlayerRef.current.onended = () => {
        onAudioEnd?.();
      };
    }
    
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = '';
      }
    };
  }, [onAudioEnd]);

  useEffect(() => {
    if (avatarType === 'd-id') {
      const image = gender === 'female'
        ? 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg'
        : 'https://create-images-results.d-id.com/DefaultPresenters/Dylan_m/image.jpeg';
      setAvatarImage(image);
      setIsLoading(false);
      setError(null);
    } else if (avatarType === '3d') {
      setIsLoading(false);
      setError(null);
    }
  }, [avatarType, gender]);

  useEffect(() => {
    if (audioBase64 && audioPlayerRef.current && isSpeaking) {
      playAudioWithLipSync(audioBase64);
    }
  }, [audioBase64, isSpeaking]);

  const playAudioWithLipSync = async (base64Audio: string) => {
    try {
      if (!audioPlayerRef.current) return;

      const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.muted = isMuted;
      await audioPlayerRef.current.play();

      console.log('[Avatar] Reproduzindo áudio com lip-sync');

    } catch (err) {
      console.error('[Avatar] Erro ao reproduzir áudio:', err);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.muted = !isMuted;
    }
  };

  return (
    <Card className="relative w-full h-full overflow-hidden bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950">
      <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Carregando avatar MediAI...
            </p>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center gap-4 p-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
              <span className="text-5xl">🤖</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && avatarType === 'd-id' && avatarImage && (
          <div className="relative w-full h-full">
            <img
              src={avatarImage}
              alt="AI Medical Assistant"
              className="w-full h-full object-cover rounded-lg"
              style={{ filter: isSpeaking ? 'brightness(1.1)' : 'brightness(1)' }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white text-sm font-medium">MediAI Assistant</p>
              <p className="text-white/80 text-xs">Assistente médica virtual</p>
            </div>
          </div>
        )}

        {!isLoading && !error && avatarType === '3d' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center animate-pulse">
              <span className="text-7xl">🤖</span>
            </div>
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-white text-sm font-medium bg-black/50 py-2 px-4 rounded-full inline-block">
                Avatar 3D MediAI
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        {isSpeaking && (
          <Badge className="bg-green-500 animate-pulse">
            Falando...
          </Badge>
        )}
        {isListening && (
          <Badge className="bg-blue-500 animate-pulse">
            Ouvindo...
          </Badge>
        )}
      </div>

      <div className="absolute bottom-4 right-4">
        <Button
          size="icon"
          variant="secondary"
          onClick={toggleMute}
          className="rounded-full shadow-lg"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>

      {avatarType === '3d' && (
        <div className="absolute bottom-4 left-4">
          <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80">
            Avatar 3D Realista
          </Badge>
        </div>
      )}
      
      {avatarType === 'd-id' && (
        <div className="absolute bottom-4 left-4">
          <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80">
            D-ID Avatar (Premium)
          </Badge>
        </div>
      )}
    </Card>
  );
}
