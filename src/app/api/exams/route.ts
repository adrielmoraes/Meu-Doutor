import { NextResponse } from 'next/server';
import { getExams } from '@/lib/db-adapter';

export async function GET() {
  try {
    const exams = await getExams();
    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}
