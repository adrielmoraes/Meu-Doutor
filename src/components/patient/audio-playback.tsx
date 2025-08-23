"use client";

import { useState, useRef, useEffect } from "react";
import { PlayCircle, Square, Loader2 } from "lucide-react";
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

  // Create an Audio element and store it in the ref
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // If pre-generated audio exists, set it
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

  const generateAndPlayAudio = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      return;
    }

    if (audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.play();
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await textToSpeech({ text: textToSpeak });
      const newAudioSrc = response.audioDataUri;
      setAudioSrc(newAudioSrc);
      audioRef.current.src = newAudioSrc;
      audioRef.current.play();
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
    <Alert className="bg-primary/10 border-primary/20">
      <AlertTitle className="font-bold">Ouvir Explicação em Áudio</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        Clique no botão para que a IA narre a análise para você.
        <Button
          size="icon"
          variant="ghost"
          onClick={generateAndPlayAudio}
          disabled={isGenerating}
          aria-label={isPlaying ? "Parar áudio" : "Reproduzir áudio"}
        >
          {isGenerating ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : isPlaying ? (
            <Square className="h-6 w-6 text-destructive" />
          ) : (
            <PlayCircle className="h-6 w-6 text-primary" />
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default AudioPlayback;
