'use server';

import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function startVideoCallAction(patientId: string, appointmentId: string) {
  const session = await getSession();
  
  if (!session || session.role !== 'doctor') {
    throw new Error('Não autorizado');
  }

  const roomName = `consultation-${appointmentId}-${Date.now()}`;
  
  return {
    success: true,
    roomName,
    redirectUrl: `/doctor/video-call?patientId=${patientId}&roomName=${roomName}`
  };
}
