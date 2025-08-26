
"use client";

import { useState, useRef, useEffect } from "react";
import { PlayCircle, PauseCircle, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { textToSpeech } from "@/ai/flows/text-to-speech";

interface AudioPlaybackProps {
  textToSpeak: string;
  preGeneratedAudioUri?: string | null;
}

const AudioPlayback: React.FC<AudioPlaybackProps> = ({ textToSpeak, preGeneratedAudioUri }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Only create audio object on the client side
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
        setIsPlaying(false);
        setIsPaused(true);
    }
    const handleEnded = () => {
        setIsPlaying(false);
        setIsPaused(false);
    }

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    if (preGeneratedAudioUri) {
        audio.src = preGeneratedAudioUri;
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [preGeneratedAudioUri]);

  const toggleAudio = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      return;
    }

    if (isPaused || audioRef.current.src) {
        audioRef.current.play().catch(e => console.error("Audio resume failed:", e));
        return;
    }
    
    setIsGenerating(true);
    try {
      const response = await textToSpeech({ text: textToSpeak });
      if (response?.audioDataUri) {
        audioRef.current.src = response.audioDataUri;
        audioRef.current.play().catch(e => console.error("Audio play failed after generation:", e));
      } else {
        throw new Error("TTS flow did not return audio data.");
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Áudio",
        description: "Não foi possível gerar a narração. Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonContent = () => {
      if (isGenerating) {
        return <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando Áudio...</>
      }
      if (isPlaying) {
        return <><PauseCircle className="mr-2 h-5 w-5" /> Pausar Áudio</>
      }
      if(isPaused) {
        return <><PlayCircle className="mr-2 h-5 w-5" /> Continuar Ouvindo</>
      }
      return <><Volume2 className="mr-2 h-5 w-5" /> Ouvir Recomendação</>
  }

  return (
    <div className="mt-4">
        <Button
            onClick={toggleAudio}
            disabled={isGenerating}
            aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
            size="lg"
            className="w-full"
            variant={isPlaying ? "outline" : "default"}
        >
        {getButtonContent()}
        </Button>
    </div>
  );
};

export default AudioPlayback;
