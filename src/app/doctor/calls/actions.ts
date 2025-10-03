'use server';

import { getSession } from '@/lib/session';

export async function getCurrentDoctorId(): Promise<string | null> {
  const session = await getSession();
  if (session && session.role === 'doctor') {
    return session.userId;
  }
  return null;
}
