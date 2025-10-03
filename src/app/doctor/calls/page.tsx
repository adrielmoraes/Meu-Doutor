'use client';

import { useState, useEffect } from 'react';
import { VideoCall } from '@/components/video-call/VideoCall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, PhoneOff } from 'lucide-react';
import { getCurrentDoctorId } from './actions';

interface CallRequest {
  id: string;
  patientName: string;
  patientId: string;
  roomId: string;
  createdAt: string;
  status: 'waiting' | 'active' | 'ended';
}

export default function DoctorCallsPage() {
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const [activeCall, setActiveCall] = useState<CallRequest | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    if (doctorId) {
      loadCallRequests();
      const interval = setInterval(loadCallRequests, 5000);
      return () => clearInterval(interval);
    }
  }, [doctorId]);

  const initializePage = async () => {
    try {
      const currentDoctorId = await getCurrentDoctorId();
      setDoctorId(currentDoctorId);
    } catch (error) {
      console.error('Erro ao obter ID do médico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCallRequests = async () => {
    if (!doctorId) return;
    
    try {
      const response = await fetch(`/api/webrtc/doctor-calls/${doctorId}`);
      const calls = await response.json();
      setCallRequests(calls);
    } catch (error) {
      console.error('Erro ao carregar chamadas:', error);
    }
  };

  const acceptCall = async (call: CallRequest) => {
    setActiveCall(call);
    
    // Atualizar status da chamada
    try {
      await fetch('/api/webrtc/update-call-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: call.roomId,
          status: 'active',
        }),
      });
    } catch (error) {
      console.error('Erro ao aceitar chamada:', error);
    }
  };

  const endCall = () => {
    if (activeCall) {
      // Atualizar status para encerrado
      fetch('/api/webrtc/update-call-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeCall.roomId,
          status: 'ended',
        }),
      });
    }
    setActiveCall(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (activeCall && doctorId) {
    return (
      <div className="container mx-auto py-8">
        <VideoCall
          roomId={activeCall.roomId}
          userId={doctorId}
          targetId={activeCall.patientId}
          isInitiator={false}
          onCallEnd={endCall}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Chamadas de Pacientes</h1>
      
      {callRequests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Nenhuma chamada pendente no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {callRequests.map((call) => (
            <Card key={call.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{call.patientName}</span>
                  <Badge 
                    variant={call.status === 'waiting' ? 'default' : 'secondary'}
                  >
                    {call.status === 'waiting' ? 'Aguardando' : 'Em andamento'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Chamada iniciada em: {new Date(call.createdAt).toLocaleString('pt-BR')}
                </p>
                
                {call.status === 'waiting' && (
                  <Button 
                    onClick={() => acceptCall(call)}
                    className="w-full"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Atender Chamada
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}