
'use server';

import type { Doctor } from '@/types';
import { getAdminDb } from './firebase-admin';

export async function getDoctors(): Promise<Doctor[]> {
    const adminDb = getAdminDb();
    const doctorsCol = adminDb.collection('doctors');
    const doctorSnapshot = await doctorsCol.get();
    const doctorList = doctorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
    return doctorList;
}
