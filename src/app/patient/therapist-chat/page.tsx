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

  // Parse persisted conversation history (JSON format)
  let initialHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (patient.conversationHistory) {
    try {
      const parsed = JSON.parse(patient.conversationHistory);
      if (Array.isArray(parsed)) {
        initialHistory = parsed;
      }
    } catch {
      // Legacy text format — ignore, start fresh
    }
  }

  return (
    <TherapistChat
      patientId={session.userId}
      patientName={patient.name}
      initialHistory={initialHistory}
    />
  );
}
