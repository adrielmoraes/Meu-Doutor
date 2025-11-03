import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DoctorLiveKitCall from '@/components/doctor/doctor-livekit-call';
import { getPatientById } from '@/lib/db-adapter';

export default async function DoctorVideoCallPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; roomName?: string }>;
}) {
  const session = await getSession();
  
  if (!session || session.role !== 'doctor') {
    redirect('/login');
  }

  const params = await searchParams;
  const { patientId, roomName } = params;

  if (!patientId || !roomName) {
    redirect('/doctor/schedule');
  }

  const patient = await getPatientById(patientId);

  if (!patient) {
    redirect('/doctor/schedule');
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <DoctorLiveKitCall
        roomName={roomName}
        doctorName={session.userId}
        patientName={patient.name}
      />
    </div>
  );
}
