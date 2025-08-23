"use client";

import { useState, useRef, useEffect } from "react";
import { PlayCircle, StopCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

  return (
    <Alert className="bg-primary/5 border-primary/20">
      <AlertTitle className="font-bold flex items-center">Ouvir Explicação em Áudio</AlertTitle>
      <AlertDescription className="flex items-center justify-between pt-2">
        <span className="text-sm">Clique no botão para que a IA narre a análise para você.</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleAudio}
          disabled={isGenerating}
          aria-label={isPlaying ? "Parar áudio" : "Reproduzir áudio"}
        >
          {isGenerating ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : isPlaying ? (
            <StopCircle className="h-6 w-6 text-destructive" />
          ) : (
            <PlayCircle className="h-6 w-6 text-primary" />
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default AudioPlayback;
