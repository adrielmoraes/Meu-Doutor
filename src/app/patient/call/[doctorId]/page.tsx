'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VideoCall } from '@/components/video-call/VideoCall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone } from 'lucide-react';
import { getDoctorById } from '@/lib/firestore-client-adapter';
import { Doctor } from '@/lib/types';
import { getCurrentPatientId } from '../actions';

export default function PatientCallPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [callStarted, setCallStarted] = useState(false);
  const [roomId, setRoomId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [doctorId]);

  const loadData = async () => {
    try {
      const [doctorData, currentPatientId] = await Promise.all([
        getDoctorById(doctorId),
        getCurrentPatientId()
      ]);
      setDoctor(doctorData);
      setPatientId(currentPatientId);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="container mx-auto py-8">
        <VideoCall
          roomId={roomId}
          userId={patientId}
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