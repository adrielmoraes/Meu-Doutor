"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PlayCircle, PauseCircle, Loader2, Volume2, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { textToSpeech } from "@/ai/flows/text-to-speech";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const isTextTooLong = textToSpeak.length > MAX_TTS_CHARS;

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    if (!audio) return;

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

    if (preGeneratedAudioUri) {
      audio.src = preGeneratedAudioUri;
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
  }, [preGeneratedAudioUri, section, textToSpeak]);

  const saveAudioToServer = useCallback(async (audioDataUri: string) => {
    try {
      const response = await fetch('/api/wellness-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, audioDataUri }),
      });

      if (response.ok) {
        setHasSavedAudio(true);
        console.log(`[Wellness Audio] Audio saved for section "${section}"`);
      } else {
        console.error('[Wellness Audio] Failed to save audio:', await response.text());
      }
    } catch (error) {
      console.error('[Wellness Audio] Error saving audio:', error);
    }
  }, [section]);

  const toggleAudio = async () => {
    if (!audioRef.current) return;

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
      const response = await textToSpeech({ text: textToSpeak, patientId });
      if (response?.audioDataUri) {
        audioRef.current.src = response.audioDataUri;
        setAudioLoaded(true);
        audioRef.current.play().catch(e => console.error("Audio play failed after generation:", e));

        saveAudioToServer(response.audioDataUri);
      } else {
        throw new Error("A API de áudio não retornou dados.");
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível gerar a narração. Tente novamente.";
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Áudio",
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
