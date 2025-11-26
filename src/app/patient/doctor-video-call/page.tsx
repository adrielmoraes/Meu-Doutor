'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PatientLiveKitCall from '@/components/patient/patient-livekit-call';
import { Loader2 } from 'lucide-react';

function VideoCallContent() {
  const searchParams = useSearchParams();
  const roomName = searchParams.get('roomName');
  const doctorId = searchParams.get('doctorId');

  if (!roomName || !doctorId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Chamada Inválida</h1>
          <p className="text-slate-400">Parâmetros de chamada não encontrados.</p>
        </div>
      </div>
    );
  }

  return (
    <PatientLiveKitCall 
      roomName={roomName}
      doctorId={doctorId}
    />
  );
}

export default function PatientDoctorVideoCallPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    }>
      <VideoCallContent />
    </Suspense>
  );
}
