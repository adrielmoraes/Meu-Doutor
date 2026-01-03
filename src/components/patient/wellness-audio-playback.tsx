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
  const [isPaused, setIsPaused] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [hasSavedAudio, setHasSavedAudio] = useState(!!preGeneratedAudioUri);
  const [resolvedAudioUri, setResolvedAudioUri] = useState<string | null>(preGeneratedAudioUri || null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    if (!audio) return;

    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      setIsPaused(true);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    const handleCanPlay = () => setAudioLoaded(true);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    if (resolvedAudioUri) {
      audio.src = resolvedAudioUri;
      audio.load();
      setHasSavedAudio(true);
      setAudioLoaded(true);
      setIsPaused(false);
    } else {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setIsPlaying(false);
      setIsPaused(false);
      setAudioLoaded(false);
      setHasSavedAudio(false);
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
    };
  }, [resolvedAudioUri, section, textToSpeak]);

  const toggleAudio = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
      audioRef.current.crossOrigin = 'anonymous';
    }

    if (isPlaying) {
      audioRef.current.pause();
      return;
    }

    if (isPaused && audioRef.current.src) {
      audioRef.current.play().catch(e => console.error("Audio resume failed:", e));
      return;
    }

    if (audioLoaded && audioRef.current.src) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      return;
    }

    setIsGenerating(true);
    try {
      const existingUri = resolvedAudioUri || await fetchSavedAudio();
      if (existingUri) {
        audioRef.current.src = existingUri;
        audioRef.current.load();
        setAudioLoaded(true);
        setIsPaused(false);
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        return;
      }

      const saveResponse = await fetch('/api/wellness-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, text: textToSpeak, patientId }),
      });

      const saveData = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok || !saveData?.url) {
        const details = typeof saveData?.error === 'string' ? saveData.error : '';
        throw new Error(details || "Não foi possível gerar/salvar o áudio.");
      }

      const url = saveData.url as string;
      setResolvedAudioUri(url);
      setHasSavedAudio(true);
      audioRef.current.src = url;
      audioRef.current.load();
      setAudioLoaded(true);
      setIsPaused(false);
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      console.log(`[Wellness Audio] Audio ready for section "${section}"`);
      return;
    } catch (error: any) {
      console.error("Failed to generate audio:", error);

      // Ignore AbortError which happens when pausing while loading/playing
      if (error.name === 'AbortError' || error.message?.includes('interrupted by a call to pause')) {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : "Não foi possível reproduzir o áudio. Tente novamente.";
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
    if (isPlaying) {
      return <><PauseCircle className="mr-2 h-5 w-5" /> Pausar Áudio</>;
    }
    if (isPaused) {
      return <><PlayCircle className="mr-2 h-5 w-5" /> Continuar Ouvindo</>;
    }
    if (hasSavedAudio && audioLoaded) {
      return <><CheckCircle className="mr-2 h-5 w-5 text-green-500" /> Ouvir Recomendação</>;
    }
    return <><Volume2 className="mr-2 h-5 w-5" /> Ouvir Recomendação</>;
  };

  return (
    <div className="mt-4">
      <Button
        onClick={toggleAudio}
        disabled={isGenerating || isTextTooLong}
        aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
        size="lg"
        className="w-full"
        variant={isPlaying ? "outline" : "default"}
      >
        {getButtonContent()}
      </Button>
      {hasSavedAudio && !isGenerating && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Áudio salvo - não será necessário gerar novamente
        </p>
      )}
    </div>
  );
};

export default WellnessAudioPlayback;
