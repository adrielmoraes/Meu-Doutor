"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PlayCircle, PauseCircle, Loader2, Volume2, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface WellnessAudioPlaybackProps {
  textToSpeak: string;
  section: 'dietary' | 'exercise' | 'mental';
  preGeneratedAudioUri?: string | null;
  patientId?: string;
}

const MAX_TTS_CHARS = 6000;

const WellnessAudioPlayback: React.FC<WellnessAudioPlaybackProps> = ({
  textToSpeak,
  section,
  preGeneratedAudioUri,
  patientId
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSavedAudio, setHasSavedAudio] = useState(!!preGeneratedAudioUri);
  const [resolvedAudioUri, setResolvedAudioUri] = useState<string | null>(preGeneratedAudioUri || null);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const { toast } = useToast();

  const isTextTooLong = (textToSpeak || "").length > MAX_TTS_CHARS;

  const fetchSavedAudio = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/wellness-audio?section=${section}`, {
        method: 'GET',
        signal,
        cache: 'no-store',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const uri = data?.audioDataUri as string | null | undefined;
      if (uri) {
        setResolvedAudioUri(uri);
        setHasSavedAudio(true);
        return uri;
      }
      return null;
    } catch {
      return null;
    }
  }, [section]);

  useEffect(() => {
    if (preGeneratedAudioUri) {
      setResolvedAudioUri(preGeneratedAudioUri);
      setHasSavedAudio(true);
    }
  }, [preGeneratedAudioUri]);

  useEffect(() => {
    if (preGeneratedAudioUri) return;
    setResolvedAudioUri(null);
    setHasSavedAudio(false);
  }, [section, textToSpeak, preGeneratedAudioUri]);

  useEffect(() => {
    if (preGeneratedAudioUri) return;
    if (resolvedAudioUri) return;
    if (isTextTooLong) return;

    const controller = new AbortController();
    fetchSavedAudio(controller.signal);
    return () => controller.abort();
  }, [fetchSavedAudio, isTextTooLong, preGeneratedAudioUri, resolvedAudioUri]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const safePlay = async (audio: HTMLAudioElement): Promise<boolean> => {
    try {
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }
      
      console.log('[Audio] Starting playback...');
      playPromiseRef.current = audio.play();
      await playPromiseRef.current;
      playPromiseRef.current = null;
      console.log('[Audio] Playback started successfully');
      return true;
    } catch (error: any) {
      playPromiseRef.current = null;
      console.error('[Audio] Play error:', error.name, error.message);
      if (error.name === 'AbortError') {
        return false;
      }
      throw error;
    }
  };

  const safePause = async (audio: HTMLAudioElement) => {
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch {
      }
      playPromiseRef.current = null;
    }
    audio.pause();
  };

  const loadAudio = (audio: HTMLAudioElement, url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('loadeddata', onLoadedData);
        audio.removeEventListener('error', onError);
        clearTimeout(timeoutId);
      };

      const onCanPlay = () => {
        console.log('[Audio] canplaythrough event received');
        cleanup();
        resolve();
      };

      const onLoadedData = () => {
        console.log('[Audio] loadeddata event received');
        cleanup();
        resolve();
      };
      
      const onError = (e: Event) => {
        const mediaError = audio.error;
        let errorMsg = 'Erro ao carregar áudio';
        if (mediaError) {
          switch (mediaError.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMsg = 'Carregamento do áudio foi abortado';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMsg = 'Erro de rede ao carregar áudio';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMsg = 'Formato de áudio não suportado';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = 'Formato ou URL de áudio não suportado';
              break;
          }
        }
        console.error('[Audio] Load error:', errorMsg, mediaError);
        cleanup();
        reject(new Error(errorMsg));
      };

      const timeoutId = setTimeout(() => {
        console.warn('[Audio] Load timeout, attempting to play anyway');
        cleanup();
        resolve();
      }, 10000);

      audio.addEventListener('canplaythrough', onCanPlay);
      audio.addEventListener('loadeddata', onLoadedData);
      audio.addEventListener('error', onError);
      
      console.log('[Audio] Loading audio from:', url.substring(0, 60) + '...');
      audio.src = url;
      audio.load();
    });
  };

  const toggleAudio = async () => {
    setAudioError(null);
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    const audio = audioRef.current;

    if (isPlaying) {
      await safePause(audio);
      setIsPlaying(false);
      return;
    }

    if (audio.src && audio.currentTime > 0 && audio.paused) {
      setIsLoading(true);
      try {
        const played = await safePlay(audio);
        if (played) setIsPlaying(true);
      } catch (e) {
        console.error("Resume failed:", e);
        setAudioError("Erro ao retomar áudio");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (resolvedAudioUri) {
      setIsLoading(true);
      try {
        await loadAudio(audio, resolvedAudioUri);
        audio.currentTime = 0;
        
        audio.onended = () => {
          setIsPlaying(false);
        };
        audio.onpause = () => {
          if (audio.currentTime < audio.duration) {
            setIsPlaying(false);
          }
        };

        const played = await safePlay(audio);
        if (played) setIsPlaying(true);
      } catch (e) {
        console.error("Play failed:", e);
        setAudioError("Erro ao reproduzir áudio");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsGenerating(true);
    try {
      const existingUri = await fetchSavedAudio();
      let urlToPlay = existingUri;

      if (!urlToPlay) {
        const saveResponse = await fetch('/api/wellness-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section, text: textToSpeak, patientId }),
        });

        const saveData = await saveResponse.json().catch(() => ({}));
        if (!saveResponse.ok || !saveData?.url) {
          const details = typeof saveData?.error === 'string' ? saveData.error : '';
          throw new Error(details || "Não foi possível gerar o áudio.");
        }

        urlToPlay = saveData.url as string;
        setResolvedAudioUri(urlToPlay);
        setHasSavedAudio(true);
      }

      await loadAudio(audio, urlToPlay);
      audio.currentTime = 0;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      audio.onpause = () => {
        if (audio.currentTime < audio.duration) {
          setIsPlaying(false);
        }
      };

      const played = await safePlay(audio);
      if (played) setIsPlaying(true);
      
    } catch (error: any) {
      console.error("Failed to generate/play audio:", error);

      if (error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : "Erro ao reproduzir áudio.";
      setAudioError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erro no Áudio",
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonContent = () => {
    if (isTextTooLong) {
      return <><XCircle className="mr-2 h-5 w-5" /> Texto muito longo para narrar</>;
    }
    if (isGenerating) {
      return <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando Áudio...</>;
    }
    if (isLoading) {
      return <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...</>;
    }
    if (isPlaying) {
      return <><PauseCircle className="mr-2 h-5 w-5" /> Pausar Áudio</>;
    }
    if (hasSavedAudio) {
      return <><CheckCircle className="mr-2 h-5 w-5 text-green-500" /> Ouvir Recomendação</>;
    }
    return <><Volume2 className="mr-2 h-5 w-5" /> Ouvir Recomendação</>;
  };

  return (
    <div className="mt-4">
      <Button
        onClick={toggleAudio}
        disabled={isGenerating || isLoading || isTextTooLong}
        aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
        size="lg"
        className="w-full"
        variant={isPlaying ? "outline" : "default"}
      >
        {getButtonContent()}
      </Button>
      {audioError && (
        <p className="text-xs text-red-500 mt-2 text-center">
          {audioError}
        </p>
      )}
      {hasSavedAudio && !isGenerating && !audioError && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Áudio salvo - não será necessário gerar novamente
        </p>
      )}
    </div>
  );
};

export default WellnessAudioPlayback;
