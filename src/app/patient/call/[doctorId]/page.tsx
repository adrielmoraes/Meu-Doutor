'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { VideoCall } from '@/components/video-call/VideoCall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone } from 'lucide-react';
import { getDoctorByIdAction } from './actions';
import type { Doctor } from '@/types';
import { getCurrentPatientId } from '../actions';
import { TalkingAvatar3D } from '@/components/avatar/TalkingAvatar3D';

export default function PatientCallPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [callStarted, setCallStarted] = useState(false);
  const [roomId, setRoomId] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const [doctorData, currentPatientId] = await Promise.all([
        getDoctorByIdAction(doctorId),
        getCurrentPatientId()
      ]);
      setDoctor(doctorData);
      setPatientId(currentPatientId);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startCall = async () => {
    if (!patientId) {
      console.error('ID do paciente não encontrado');
      return;
    }

    const newRoomId = `call_${doctorId}_${Date.now()}`;
    setRoomId(newRoomId);
    setCallStarted(true);

    try {
      const response = await fetch('/api/webrtc/create-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: newRoomId,
          patientId,
          doctorId,
          type: 'patient-initiated',
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar chamada');
      }
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
      setCallStarted(false);
    }
  };

  const handleCallEnd = () => {
    setCallStarted(false);
    setRoomId('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Médico não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (callStarted && roomId && patientId) {
    return (
      <div className="container mx-auto py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VideoCall
            roomId={roomId}
            userId={patientId}
            targetId={doctorId}
            isInitiator={true}
            onCallEnd={handleCallEnd}
          />
        </div>
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400 text-center">IA MediAI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <TalkingAvatar3D 
                  className="w-full h-96"
                  mood="neutral"
                  onReady={() => console.log('Avatar 3D pronto')}
                />
              </div>
              <p className="text-sm text-cyan-300/80 text-center mt-4">
                Assistente de IA acompanhando a consulta
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            Chamada com Dr. {doctor.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-4">
            <p className="text-gray-600">Especialidade: {doctor.specialty}</p>
            <p className="text-sm text-gray-500">Preparando chamada de vídeo...</p>
          </div>
          
          <Button 
            onClick={startCall} 
            size="lg" 
            className="w-full"
          >
            <Phone className="w-4 h-4 mr-2" />
            Iniciar Chamada
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
