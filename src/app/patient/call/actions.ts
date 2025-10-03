'use server';

import { getSession } from '@/lib/session';

export async function getCurrentPatientId(): Promise<string | null> {
  const session = await getSession();
  if (session && session.role === 'patient') {
    return session.userId;
  }
  return null;
}
