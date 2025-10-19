'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioMessageProps {
  audioDataUri: string;
  duration?: number;
  isUser: boolean;
  timestamp: string;
}

export function AudioMessage({ audioDataUri, duration, isUser, timestamp }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  useEffect(() => {
    // Generate random waveform bars (WhatsApp-style)
    const bars = Array.from({ length: 40 }, () => Math.random() * 0.5 + 0.5);
    setWaveformBars(bars);

    // Create audio element
    if (typeof window !== 'undefined') {
      const audio = new Audio(audioDataUri);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      return () => {
        audio.pause();
        audio.remove();
      };
    }
  }, [audioDataUri]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) : 0;

  return (
    <div className={`flex items-center gap-2 min-w-[250px] ${isUser ? 'flex-row' : 'flex-row'}`}>
      {/* Play/Pause Button */}
      <Button
        onClick={togglePlayPause}
        size="icon"
        variant="ghost"
        className={`h-10 w-10 rounded-full ${
          isUser 
            ? 'bg-green-700 hover:bg-green-800 text-white' 
            : 'bg-slate-700 hover:bg-slate-600 text-green-400'
        }`}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="h-5 w-5 fill-current ml-0.5" />
        )}
      </Button>

      {/* Waveform */}
      <div className="flex-1 flex items-center gap-0.5 h-12 relative">
        {waveformBars.map((height, index) => {
          const isActive = progress > (index / waveformBars.length);
          return (
            <div
              key={index}
              className={`w-[2px] rounded-full transition-all ${
                isActive 
                  ? (isUser ? 'bg-green-200' : 'bg-green-400')
                  : (isUser ? 'bg-green-300/40' : 'bg-slate-500/40')
              }`}
              style={{ height: `${height * 100}%` }}
            />
          );
        })}
      </div>

      {/* Duration/Current Time */}
      <div className={`text-xs font-mono min-w-[45px] text-right ${
        isUser ? 'text-green-100' : 'text-slate-400'
      }`}>
        {formatTime(isPlaying ? currentTime : audioDuration)}
      </div>

      {/* Timestamp */}
      <div className={`text-xs ${
        isUser ? 'text-green-100/70' : 'text-slate-500'
      }`}>
        {timestamp}
      </div>
    </div>
  );
}
