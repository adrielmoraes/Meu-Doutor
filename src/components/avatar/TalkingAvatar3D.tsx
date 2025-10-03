'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface TalkingAvatar3DProps {
  onReady?: () => void;
  className?: string;
  avatarUrl?: string;
  mood?: 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry';
}

declare global {
  interface Window {
    TalkingHead?: any;
  }
}

export function TalkingAvatar3D({ 
  onReady, 
  className = '',
  avatarUrl = 'https://models.readyplayer.me/6185a4acfb622cf1cdc49348.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=webp&lod=1',
  mood = 'neutral'
}: TalkingAvatar3DProps) {
  const avatarRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTalkingHead = async () => {
      try {
        if (!avatarRef.current) return;

        // Carregar TalkingHead via CDN
        if (!window.TalkingHead) {
          const script = document.createElement('script');
          script.type = 'importmap';
          script.textContent = JSON.stringify({
            imports: {
              three: 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js/+esm',
              'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/',
              talkinghead: 'https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.1/modules/talkinghead.mjs'
            }
          });
          document.head.appendChild(script);

          const moduleScript = document.createElement('script');
          moduleScript.type = 'module';
          moduleScript.textContent = `
            import { TalkingHead } from 'talkinghead';
            window.TalkingHead = TalkingHead;
            window.dispatchEvent(new Event('talkinghead-loaded'));
          `;
          document.head.appendChild(moduleScript);

          await new Promise((resolve) => {
            window.addEventListener('talkinghead-loaded', resolve, { once: true });
          });
        }

        if (!mounted) return;

        // Criar instância do TalkingHead
        const head = new window.TalkingHead(avatarRef.current, {
          ttsEndpoint: '/api/gemini-tts',
          lipsyncModules: ['en', 'pt'],
          cameraView: 'upper',
          cameraDistance: 1.2,
          cameraY: 0.3
        });

        headRef.current = head;

        // Carregar avatar
        await head.showAvatar({
          url: avatarUrl,
          body: 'F',
          avatarMood: mood,
          ttsLang: 'pt-BR',
          ttsVoice: 'pt-BR-Standard-A',
          lipsyncLang: 'pt',
          lipsyncHeadMovement: true
        }, (ev: ProgressEvent) => {
          if (ev.lengthComputable && mounted) {
            const progress = Math.min(100, Math.round((ev.loaded / ev.total) * 100));
            setLoadingProgress(progress);
          }
        });

        if (mounted) {
          setIsLoading(false);
          onReady?.();
        }
      } catch (err) {
        console.error('Erro ao carregar avatar 3D:', err);
        if (mounted) {
          setError('Falha ao carregar avatar 3D');
          setIsLoading(false);
        }
      }
    };

    loadTalkingHead();

    return () => {
      mounted = false;
      if (headRef.current) {
        try {
          headRef.current.stopSpeaking();
        } catch (e) {
          console.error('Erro ao limpar avatar:', e);
        }
      }
    };
  }, [avatarUrl, mood, onReady]);

  // Expor método de fala via ref
  useEffect(() => {
    if (headRef.current) {
      (avatarRef.current as any)?.setAvatarInstance?.(headRef.current);
    }
  }, [headRef.current]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-lg">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
          <p className="text-cyan-400 font-medium">
            Carregando avatar... {loadingProgress}%
          </p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-lg">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}
      <div 
        ref={avatarRef} 
        className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}

export function useAvatarSpeech(avatarRef: React.RefObject<HTMLDivElement>) {
  const speak = async (text: string, options?: {
    mood?: 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry';
    voice?: string;
    onSubtitles?: (text: string) => void;
  }) => {
    const avatarInstance = (avatarRef.current as any)?.avatarInstance;
    if (!avatarInstance) {
      console.error('Avatar não inicializado');
      return;
    }

    try {
      await avatarInstance.speakText(text, {
        avatarMood: options?.mood || 'neutral',
        ttsVoice: options?.voice || 'pt-BR-Standard-A'
      }, options?.onSubtitles);
    } catch (err) {
      console.error('Erro ao falar:', err);
    }
  };

  const stopSpeaking = () => {
    const avatarInstance = (avatarRef.current as any)?.avatarInstance;
    if (avatarInstance) {
      try {
        avatarInstance.stopSpeaking();
      } catch (err) {
        console.error('Erro ao parar fala:', err);
      }
    }
  };

  return { speak, stopSpeaking };
}
