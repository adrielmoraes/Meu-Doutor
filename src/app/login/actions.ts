'use server';

import { getDoctorByEmailWithAuth, getPatientByEmailWithAuth, getAdminByEmailWithAuth } from '@/lib/db-adapter';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { login as createSession } from '@/lib/session';
import { loginRateLimiter } from '@/lib/rate-limiter';
import { headers } from 'next/headers';
import { logUserActivity, reportSecurityIncident } from '@/lib/security-audit';

const LoginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});


export async function loginAction(prevState: any, formData: FormData) {
  const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Por favor, corrija os erros no formulário."
    };
  }

  const { email, password } = validatedFields.data;

  // Rate limiting por IP
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  // Verificar se está bloqueado
  if (loginRateLimiter.isBlocked(ip)) {
    const remainingSeconds = loginRateLimiter.getBlockedTimeRemaining(ip);
    const minutes = Math.ceil(remainingSeconds / 60);

    console.warn(`[RateLimiter] Login bloqueado para IP ${ip} - ${remainingSeconds}s restantes`);

    return {
      ...prevState,
      message: `Muitas tentativas de login falhadas. Tente novamente em ${minutes} minuto(s).`,
    };
  }

  let redirectPath: string | null = null;

  try {
    console.log('Tentando login com email:', email);

    // First check if it's an admin
    const admin = await getAdminByEmailWithAuth(email);
    if (admin && admin.password) {
        const passwordIsValid = await bcrypt.compare(password, admin.password);

        if (passwordIsValid) {
            console.log('Login bem-sucedido para admin:', admin.id);
            await createSession({ userId: admin.id, role: 'admin' });
            console.log('Sessão criada para admin, redirecionando...');
            redirectPath = '/admin';
            
            logUserActivity({
              userId: admin.id,
              userType: 'admin',
              userEmail: email,
              action: 'login',
              ipAddress: ip,
              userAgent: headersList.get('user-agent') || undefined,
              details: { method: 'email_password' },
            }).catch(console.error);
        } else {
            console.log('Senha inválida para admin');
        }
    }

    // Then check doctor
    if (!redirectPath) {
        const doctor = await getDoctorByEmailWithAuth(email);
        if (doctor && doctor.password) {
            // Verificar se o email foi confirmado
            if (!doctor.emailVerified) {
              return {
                ...prevState,
                message: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
                errors: { email: ['Email não verificado.'], password: [] },
              };
            }

            const passwordIsValid = await bcrypt.compare(password, doctor.password);

            if (passwordIsValid) {
                console.log('Login bem-sucedido para médico:', doctor.id);
                await createSession({ userId: doctor.id, role: 'doctor' });
                console.log('Sessão criada para médico, redirecionando...');
                redirectPath = '/doctor';
                
                logUserActivity({
                  userId: doctor.id,
                  userType: 'doctor',
                  userEmail: email,
                  action: 'login',
                  ipAddress: ip,
                  userAgent: headersList.get('user-agent') || undefined,
                  details: { method: 'email_password' },
                }).catch(console.error);
            } else {
                console.log('Senha inválida para médico');
            }
        }
    }

    // Finally check patient
    if (!redirectPath) {
        console.log('Verificando paciente...');
        const patient = await getPatientByEmailWithAuth(email);
        console.log('Paciente encontrado:', !!patient);
        console.log('Paciente tem senha:', !!patient?.password);

        if (patient && patient.password) {
            // Verificar se o email foi confirmado
            if (!patient.emailVerified) {
              return {
                ...prevState,
                message: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
                errors: { email: ['Email não verificado.'], password: [] },
              };
            }

            const passwordIsValid = await bcrypt.compare(password, patient.password);
            console.log('Senha válida:', passwordIsValid);

            if (passwordIsValid) {
                 console.log('Login bem-sucedido para paciente:', patient.id);
                 await createSession({ userId: patient.id, role: 'patient' });
                 console.log('Sessão criada para paciente, redirecionando...');
                 redirectPath = '/patient/dashboard';
                 
                 logUserActivity({
                   userId: patient.id,
                   userType: 'patient',
                   userEmail: email,
                   action: 'login',
                   ipAddress: ip,
                   userAgent: headersList.get('user-agent') || undefined,
                   details: { method: 'email_password' },
                 }).catch(console.error);
            } else {
                console.log('Senha inválida para paciente');
            }
        } else {
            console.log('Paciente não encontrado ou sem senha');
        }
    }

    if (redirectPath) {
        // Login bem-sucedido - limpar tentativas
        loginRateLimiter.recordSuccessfulAttempt(ip);

        return {
            ...prevState,
            success: true,
            redirectPath,
            message: 'Login bem-sucedido!',
        };
    }

    // Login falhou - registrar tentativa
    loginRateLimiter.recordFailedAttempt(ip);
    const remainingAttempts = loginRateLimiter.getRemainingAttempts(ip);

    console.warn(`[RateLimiter] Tentativa falhada para IP ${ip} - ${remainingAttempts} tentativas restantes`);

    logUserActivity({
      userId: 'unknown',
      userType: 'patient',
      userEmail: email,
      action: 'login_failed',
      ipAddress: ip,
      userAgent: headersList.get('user-agent') || undefined,
      success: false,
      details: { remainingAttempts, reason: 'invalid_credentials' },
    }).catch(console.error);

    if (remainingAttempts <= 1) {
      reportSecurityIncident({
        incidentType: 'failed_login_attempts',
        severity: 'medium',
        description: `Múltiplas tentativas de login falhadas para email: ${email} do IP: ${ip}`,
        metadata: { email, ip, remainingAttempts },
      }).catch(console.error);
    }

    // Generic error message for security reasons
    let message = 'E-mail ou senha inválidos.';
    if (remainingAttempts <= 2 && remainingAttempts > 0) {
      message += ` Você tem ${remainingAttempts} tentativa(s) restante(s).`;
    }

    return {
      ...prevState,
      message,
    };

  } catch (error: any) {
    // Se for um redirect do Next.js, repropaga o erro para o framework tratar corretamente
    if (error?.digest && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
        throw error;
    }
    // Log apenas para outros tipos de erros
    console.error('Login error:', error);
    return {
      ...prevState,
      message: 'Ocorreu um erro no servidor. Por favor, tente novamente.',
    };
  }
}