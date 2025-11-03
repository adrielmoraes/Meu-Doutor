
'use server';

import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { updateDoctorStatus } from '@/lib/db-adapter'; // Importar a função de atualização

export type SessionPayload = {
    userId: string;
    role: 'patient' | 'doctor' | 'admin';
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
  const sessionCookie = cookieStore.get('session')?.value; // Obter o cookie antes de excluí-lo
  const session = await decrypt(sessionCookie); // Descriptografar para obter o userId e role

  // Se for um médico, atualizar o status para offline
  if (session && session.role === 'doctor' && session.userId) {
    try {
      await updateDoctorStatus(session.userId, false); // Definir como offline
      console.log(`[Logout] Médico ${session.userId} definido como offline.`);
    } catch (e) {
      console.error("Failed to update doctor status to offline during logout:", e);
    }
  }

  cookieStore.set('session', '', { expires: new Date(0), path: '/' });
  redirect('/login');
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  console.log('[Session Debug] getSession - sessionCookie:', sessionCookie ? sessionCookie.substring(0, 20) + '...' : 'Nenhum cookie de sessão');

  const decryptedSession = await decrypt(sessionCookie);

  console.log('[Session Debug] getSession - decryptedSession:', decryptedSession ? JSON.stringify(decryptedSession) : 'Falha na descriptografia ou cookie ausente');

  return decryptedSession;
}

// Client-side helper, made isomorphic to also work when called from the server.
export async function getSessionOnClient() {
    // Se estiver no cliente (navegador), use fetch relativo (evita problemas de host/porta)
    if (typeof window !== 'undefined') {
        try {
            const res = await fetch('/api/session', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!res.ok) {
                console.error(`[getSessionOnClient] Failed to fetch session on client. Status: ${res.status}`);
                return null;
            }
            const data = await res.json();
            return (data as { session: SessionPayload | null }).session ?? null;
        } catch (error) {
            console.error('[getSessionOnClient] Client fetch error:', error);
            return null;
        }
    }

    // Se estiver no servidor, evite chamada HTTP e use leitura direta via cookies()
    try {
        const session = await getSession();
        return session;
    } catch (error) {
        console.error('[getSessionOnClient] Server read error:', error);
        return null;
    }
}
