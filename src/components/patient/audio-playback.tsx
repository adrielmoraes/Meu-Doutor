
"use client";

import { useState, useRef, useEffect } from "react";
import { PlayCircle, StopCircle, Loader2, Volume2 } from "lucide-react";
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
  const [audioSrc, setAudioSrc] = useState<string | null>(preGeneratedAudioUri || null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    if (preGeneratedAudioUri) {
        setAudioSrc(preGeneratedAudioUri);
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

    // If audio is already loaded or generated, just play it
    if (audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await textToSpeech({ text: textToSpeak });
      const newAudioSrc = response.audioDataUri;
      setAudioSrc(newAudioSrc);
      audioRef.current.src = newAudioSrc;
      audioRef.current.play().catch(e => console.error("Audio play failed after generation:", e));
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
        return <><StopCircle className="mr-2 h-5 w-5" /> Parar Áudio</>
      }
      return <><Volume2 className="mr-2 h-5 w-5" /> Ouvir Explicação</>
  }

  return (
    <Button
        onClick={toggleAudio}
        disabled={isGenerating}
        aria-label={isPlaying ? "Parar áudio" : "Reproduzir áudio"}
        size="lg"
        className="w-full"
        variant={isPlaying ? "destructive" : "default"}
    >
       {getButtonContent()}
    </Button>
  );
};

export default AudioPlayback;
