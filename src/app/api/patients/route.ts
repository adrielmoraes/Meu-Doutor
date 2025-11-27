import { NextResponse } from 'next/server';
import { getPatients } from '@/lib/db-adapter';

export async function GET() {
  try {
    const patients = await getPatients();
    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}
