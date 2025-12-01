import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { logUserActivity } from '@/lib/security-audit';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (sessionCookie) {
      const session = await decrypt(sessionCookie);
      
      if (session) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
          || request.headers.get('x-real-ip') 
          || undefined;
        
        logUserActivity({
          userId: session.userId,
          userType: session.role,
          action: 'logout',
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || undefined,
        }).catch(console.error);
      }
    }
    
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
