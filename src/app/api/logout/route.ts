import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.delete('session');
    
    return response;
  } catch (error) {
    console.error('[Logout] Erro ao fazer logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
}
