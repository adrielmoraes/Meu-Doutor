
'use server';

import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { updateDoctorStatus } from '@/lib/firestore-admin-adapter'; // Importar a função de atualização

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

// Debug: Log a part of the secret key to ensure consistency
console.log('[Session Debug] JWT_SECRET (partial):', secretKey.substring(0, 5) + '...');

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
    // This function is executed on the server, either via an RPC call from a client component
    // or a direct call from another server-side function. In either case, it's running on the server.
    // Server-side 'fetch' requires an absolute URL.
    const host = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'http://localhost:3000';
    
    const url = `${host}/api/session`;

    // When this function is executed on the server, `fetch` does not automatically
    // send the cookies of the client that initiated the request.
    // The `/api/session` route needs the session cookie to identify the user,
    // so we must manually forward the cookies.
    const cookieHeader = cookies().toString();

    try {
        const response = await fetch(url, {
            headers: {
                // Forward the cookie from the incoming request to the API route.
                'Cookie': cookieHeader,
            }
        });

        if (!response.ok) {
            console.error(`[getSessionOnClient] Failed to fetch session. Status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data.session as SessionPayload | null;

    } catch (error) {
        // Catching potential errors, like the 'Invalid URL' one.
        console.error(`[getSessionOnClient] An error occurred while fetching the session:`, error);
        return null;
    }
}
