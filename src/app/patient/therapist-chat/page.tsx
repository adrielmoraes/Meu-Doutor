import { getSession } from '@/lib/session';
import { getPatientById } from '@/lib/db-adapter';
import { redirect } from 'next/navigation';
import TherapistChat from '@/components/patient/therapist-chat';

export default async function TherapistChatPage() {
  const session = await getSession();
  
  if (!session || session.role !== 'patient') {
    redirect('/login');
  }

  const patient = await getPatientById(session.userId);

  if (!patient) {
    redirect('/patient/dashboard');
  }

  return (
    <TherapistChat 
      patientId={session.userId} 
      patientName={patient.name}
    />
  );
}
