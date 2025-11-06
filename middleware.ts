
import { NextResponse, type NextRequest } from 'next/server';
import { db } from './server/storage';
import { replitUsers } from './shared/schema';
import { eq } from 'drizzle-orm';

const protectedPatientRoutes = ['/patient'];
const protectedDoctorRoutes = ['/doctor'];
const publicRoutes = ['/login', '/register', '/'];

/**
 * Adiciona headers de segurança às respostas
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy - permite recursos necessários para o MediAI
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.googleusercontent.com https://*.livekit.cloud https://tavus.io;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.googleapis.com https://*.livekit.cloud wss://*.livekit.cloud https://api.stripe.com https://tavus.io wss://tavus.io https://*.daily.co;
    media-src 'self' blob: https://*.livekit.cloud https://tavus.io;
    object-src 'none';
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://tavus.io;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Previne clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Previne MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Controle de informações do referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Controle de permissões de APIs do navegador
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(), interest-cohort=()'
  );
  
  // HSTS - força HTTPS (apenas em produção)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
  
  // XSS Protection (legacy, mas ainda útil)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const replitUserId = request.headers.get('x-replit-user-id');
  const replitUserName = request.headers.get('x-replit-user-name');
  
  // Verificar também a sessão JWT dos cookies
  const sessionCookie = request.cookies.get('session')?.value;

  const isPatientRoute = protectedPatientRoutes.some(prefix => pathname.startsWith(prefix));
  const isDoctorRoute = protectedDoctorRoutes.some(prefix => pathname.startsWith(prefix));
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Se não tem Replit Auth, verificar sessão JWT
  if (!replitUserId && sessionCookie) {
    try {
      const { decrypt } = await import('@/lib/session');
      const session = await decrypt(sessionCookie);
      
      if (session && session.role) {
        // SEMPRE redirecionar da página inicial para o dashboard apropriado
        if (pathname === '/' || pathname === '/login' || pathname === '/register') {
          const dashboardUrl = session.role === 'patient' ? '/patient/dashboard' : '/doctor';
          const response = NextResponse.redirect(new URL(dashboardUrl, request.url));
          return addSecurityHeaders(response);
        }
        
        // Verificar acesso a rotas protegidas baseado na role da sessão
        if (isPatientRoute && session.role !== 'patient') {
          const response = NextResponse.redirect(new URL('/login', request.url));
          return addSecurityHeaders(response);
        }
        if (isDoctorRoute && session.role !== 'doctor') {
          const response = NextResponse.redirect(new URL('/login', request.url));
          return addSecurityHeaders(response);
        }
        
        // Sessão válida, permitir acesso a outras rotas
        const response = NextResponse.next();
        return addSecurityHeaders(response);
      }
    } catch (e) {
      console.error('[Middleware] Erro ao verificar sessão JWT:', e);
    }
  }
  
  if (!replitUserId && !sessionCookie && (isPatientRoute || isDoctorRoute)) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    return addSecurityHeaders(response);
  }

  if (replitUserId) {
    const userMapping = await db
      .select()
      .from(replitUsers)
      .where(eq(replitUsers.replitUserId, replitUserId))
      .limit(1);

    if (userMapping.length === 0 && (isPatientRoute || isDoctorRoute)) {
      const response = NextResponse.redirect(new URL('/role-selection', request.url));
      return addSecurityHeaders(response);
    }

    const role = userMapping[0]?.role;

    // SEMPRE redirecionar usuário autenticado da página inicial/login para o dashboard apropriado
    if ((pathname === '/' || pathname === '/login' || pathname === '/register') && role) {
      const dashboardUrl = role === 'patient' ? '/patient/dashboard' : '/doctor';
      const response = NextResponse.redirect(new URL(dashboardUrl, request.url));
      return addSecurityHeaders(response);
    }

    if (isPatientRoute && role !== 'patient') {
      const response = NextResponse.redirect(new URL('/login', request.url));
      return addSecurityHeaders(response);
    }
    if (isDoctorRoute && role !== 'doctor') {
      const response = NextResponse.redirect(new URL('/login', request.url));
      return addSecurityHeaders(response);
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
