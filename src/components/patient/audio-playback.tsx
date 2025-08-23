"use client";

import { useState, useEffect, useRef } from "react";
import { PlayCircle, Square } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AudioPlaybackProps {
  textToSpeak: string;
}

const AudioPlayback: React.FC<AudioPlaybackProps> = ({ textToSpeak }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "pt-BR";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;

    // Cleanup function to cancel speech when component unmounts or text changes
    return () => {
      synth.cancel();
    };
  }, [textToSpeak]);

  const handlePlayAudio = () => {
    const synth = window.speechSynthesis;
    if (!utteranceRef.current) return;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
    } else {
      // Ensure any previous speech is stopped before starting a new one
      synth.cancel();
      synth.speak(utteranceRef.current);
    }
  };

  return (
    <Alert className="bg-primary/10 border-primary/20">
      <AlertTitle className="font-bold">Reproduzir Áudio</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        Clique no botão para que a IA narre e explique o diagnóstico.
        <Button
          size="icon"
          variant="ghost"
          onClick={handlePlayAudio}
          aria-label={isSpeaking ? "Parar áudio" : "Reproduzir áudio"}
        >
          {isSpeaking ? (
            <Square className="h-6 w-6 text-destructive animate-pulse" />
          ) : (
            <PlayCircle className="h-6 w-6 text-primary" />
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default AudioPlayback;
