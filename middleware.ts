
import { NextResponse, type NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

const protectedPatientRoutes = ['/patient'];
const protectedDoctorRoutes = ['/doctor'];
const publicRoutes = ['/login', '/register', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const session = await decrypt(sessionCookie);

  const isPatientRoute = protectedPatientRoutes.some(prefix => pathname.startsWith(prefix));
  const isDoctorRoute = protectedDoctorRoutes.some(prefix => pathname.startsWith(prefix));
  
  if (!session && (isPatientRoute || isDoctorRoute)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session) {
    if (isPatientRoute && session.role !== 'patient') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (isDoctorRoute && session.role !== 'doctor') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
