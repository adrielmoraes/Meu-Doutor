import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getPatientById } from '@/lib/db-adapter';
import LiveKitConsultation from '@/components/patient/livekit-consultation';

export default async function LiveConsultationNewPage() {
  const session = await getSession();

  if (!session || session.role !== 'patient') {
    redirect('/auth/login');
  }

  const patient = await getPatientById(session.userId);

  if (!patient) {
    redirect('/patient/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <LiveKitConsultation 
        patientId={patient.id} 
        patientName={patient.name} 
      />
    </div>
  );
}
