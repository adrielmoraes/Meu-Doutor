
import { NextResponse, type NextRequest } from 'next/server';
import { db } from './server/storage';
import { replitUsers } from './shared/schema';
import { eq } from 'drizzle-orm';

const protectedPatientRoutes = ['/patient'];
const protectedDoctorRoutes = ['/doctor'];
const publicRoutes = ['/login', '/register', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const replitUserId = request.headers.get('x-replit-user-id');
  const replitUserName = request.headers.get('x-replit-user-name');

  const isPatientRoute = protectedPatientRoutes.some(prefix => pathname.startsWith(prefix));
  const isDoctorRoute = protectedDoctorRoutes.some(prefix => pathname.startsWith(prefix));
  
  if (!replitUserId && (isPatientRoute || isDoctorRoute)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (replitUserId) {
    const userMapping = await db
      .select()
      .from(replitUsers)
      .where(eq(replitUsers.replitUserId, replitUserId))
      .limit(1);

    if (userMapping.length === 0 && (isPatientRoute || isDoctorRoute)) {
      return NextResponse.redirect(new URL('/role-selection', request.url));
    }

    const role = userMapping[0]?.role;

    if (isPatientRoute && role !== 'patient') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (isDoctorRoute && role !== 'doctor') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
