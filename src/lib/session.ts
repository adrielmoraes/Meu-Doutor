
'use server';

import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type SessionPayload = {
    userId: string;
    role: 'patient' | 'doctor';
    expires?: Date;
}

// Robust handling for JWT secret to prevent runtime crashes when env is missing
const providedSecret = process.env.JWT_SECRET;
if (!providedSecret) {
  console.warn('[Session] JWT_SECRET não definido. Usando uma chave fraca apenas para desenvolvimento. Defina JWT_SECRET no seu .env para segurança.');
} else {
  console.log('[Session] JWT_SECRET carregado com sucesso');
}
const secretKey = providedSecret || 'dev-insecure-secret';
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

export async function login(payload: Omit<SessionPayload, 'expires'>) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ ...payload, expires });

  console.log('Criando sessão para usuário:', payload.userId, 'role:', payload.role);
  
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    path: '/',
  });
  
  console.log('Cookie de sessão definido com sucesso');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', { expires: new Date(0), path: '/' });
  redirect('/login');
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  return decrypt(sessionCookie);
}

// Client-side helper
export async function getSessionOnClient() {
    const response = await fetch('/api/session');
    if (!response.ok) return null;
    const { session } = await response.json();
    return session as SessionPayload | null;
}
