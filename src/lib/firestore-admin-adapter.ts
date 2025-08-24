
'use server';

import type { Doctor } from '@/types';
import { db as adminDb } from './firebase-admin';

export async function getDoctors(): Promise<Doctor[]> {
    if (!adminDb) {
        console.warn('Admin DB not initialized. Skipping getDoctors.');
        return [];
    }
    const doctorsCol = adminDb.collection('doctors');
    const doctorSnapshot = await doctorsCol.get();
    const doctorList = doctorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
    return doctorList;
}
