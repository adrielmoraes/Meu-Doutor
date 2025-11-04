import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getPatientById } from '@/lib/db-adapter';
import LiveKitConsultation from '@/components/patient/livekit-consultation';

export default async function LiveConsultationPage() {
  const session = await getSession();

  if (!session || session.role !== 'patient') {
    redirect('/auth/login');
  }

  const patient = await getPatientById(session.userId);

  if (!patient) {
    redirect('/patient/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      <LiveKitConsultation 
        patientId={patient.id} 
        patientName={patient.name} 
      />
    </div>
  );
}
