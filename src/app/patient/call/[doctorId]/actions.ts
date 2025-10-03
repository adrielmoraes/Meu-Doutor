'use server';

import { getDoctorById } from '@/lib/db-adapter';
import type { Doctor } from '@/types';

export async function getDoctorByIdAction(doctorId: string): Promise<Doctor | null> {
  return await getDoctorById(doctorId);
}
