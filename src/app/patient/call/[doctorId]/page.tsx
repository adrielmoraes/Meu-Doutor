'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VideoCall } from '@/components/video-call/VideoCall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone } from 'lucide-react';
import { getDoctorById } from '@/lib/firestore-client-adapter';
import { Doctor } from '@/lib/types';

export default function PatientCallPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [callStarted, setCallStarted] = useState(false);
  const [roomId, setRoomId] = useState<string>('');

  useEffect(() => {
    loadDoctorData();
  }, [doctorId]);

  const loadDoctorData = async () => {
    try {
      const doctorData = await getDoctorById(doctorId);
      setDoctor(doctorData);
    } catch (error) {
      console.error('Erro ao carregar dados do médico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = async () => {
    // Gerar ID único da sala
    const newRoomId = `call_${doctorId}_${Date.now()}`;
    setRoomId(newRoomId);
    setCallStarted(true);

    // Criar registro da chamada no Firebase
    try {
      const response = await fetch('/api/webrtc/create-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: newRoomId,
          patientId: 'current-patient-id', // Substituir com ID real do paciente
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

  if (callStarted && roomId) {
    return (
      <div className="container mx-auto py-8">
        <VideoCall
          roomId={roomId}
          userId="current-patient-id" // Substituir com ID real
          targetId={doctorId}
          isInitiator={true}
          onCallEnd={handleCallEnd}
        />
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