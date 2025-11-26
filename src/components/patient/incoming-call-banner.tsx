'use client';

import { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Video, User, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ActiveCall {
  roomId: string;
  doctorId: string;
  status: string;
  createdAt: string;
  doctorName: string | null;
  doctorSpecialty: string | null;
  doctorAvatar: string | null;
}

interface IncomingCallBannerProps {
  patientId: string;
}

export default function IncomingCallBanner({ patientId }: IncomingCallBannerProps) {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const router = useRouter();

  const checkForActiveCalls = useCallback(async () => {
    try {
      const response = await fetch('/api/patient/active-calls');
      if (response.ok) {
        const data = await response.json();
        if (data.hasActiveCall && data.calls.length > 0) {
          const call = data.calls[0];
          // Only show if not dismissed or if it's a different call
          if (!isDismissed || activeCall?.roomId !== call.roomId) {
            setActiveCall(call);
            setIsDismissed(false);
          }
        } else {
          setActiveCall(null);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar chamadas:', error);
    }
  }, [isDismissed, activeCall?.roomId]);

  useEffect(() => {
    // Initial check
    checkForActiveCalls();
    
    // Poll every 3 seconds
    const interval = setInterval(checkForActiveCalls, 3000);
    
    return () => clearInterval(interval);
  }, [checkForActiveCalls]);

  // Timer for elapsed time
  useEffect(() => {
    if (!activeCall) {
      setElapsedTime(0);
      return;
    }

    const callTime = new Date(activeCall.createdAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - callTime) / 1000));
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);

    return () => clearInterval(timer);
  }, [activeCall]);

  const handleAnswer = async () => {
    if (!activeCall) return;
    
    setIsLoading(true);
    router.push(`/patient/doctor-video-call?roomName=${activeCall.roomId}&doctorId=${activeCall.doctorId}`);
  };

  const handleDecline = async () => {
    if (!activeCall) return;
    
    setIsDismissed(true);
    setActiveCall(null);
    
    // Optionally notify the server that the call was declined
    try {
      await fetch('/api/patient/decline-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: activeCall.roomId })
      });
    } catch (error) {
      console.error('Erro ao recusar chamada:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeCall || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md mx-4">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 via-cyan-500/30 to-green-500/30 rounded-3xl blur-xl animate-pulse" />
        
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-cyan-500/30 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Chamada de Vídeo</span>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">Chamada Recebida</h2>
            <p className="text-slate-400 text-sm">Chamando há {formatTime(elapsedTime)}</p>
          </div>

          {/* Doctor Info */}
          <div className="px-6 py-6 flex flex-col items-center">
            <div className="relative mb-4">
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 animate-ping opacity-30" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 animate-pulse opacity-40" />
              
              <Avatar className="h-28 w-28 border-4 border-white/20 relative z-10">
                <AvatarImage src={activeCall.doctorAvatar || undefined} alt={activeCall.doctorName || 'Médico'} />
                <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white text-3xl">
                  {activeCall.doctorName?.charAt(0) || <User className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">
              {activeCall.doctorName || 'Médico'}
            </h3>
            {activeCall.doctorSpecialty && (
              <p className="text-cyan-400 text-sm font-medium">
                {activeCall.doctorSpecialty}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-8">
            <div className="flex items-center justify-center gap-6">
              {/* Decline Button */}
              <Button
                onClick={handleDecline}
                variant="ghost"
                size="icon"
                className="h-16 w-16 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all hover:scale-110"
              >
                <PhoneOff className="h-7 w-7" />
              </Button>

              {/* Answer Button */}
              <Button
                onClick={handleAnswer}
                disabled={isLoading}
                size="icon"
                className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30 transition-all hover:scale-110"
              >
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <Video className="h-8 w-8" />
                )}
              </Button>
            </div>

            <p className="text-center text-slate-500 text-xs mt-4">
              Toque no botão verde para atender
            </p>
          </div>

          {/* Dismiss hint */}
          <button
            onClick={handleDecline}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
