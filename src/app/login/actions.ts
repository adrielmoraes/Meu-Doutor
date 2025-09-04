
'use server';

import { getDoctorByEmailWithAuth, getPatientByEmailWithAuth } from '@/lib/firestore-admin-adapter';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { login as createSession } from '@/lib/session';

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

  let redirectPath: string | null = null;

  try {
    console.log('Tentando login com email:', email);
    const doctor = await getDoctorByEmailWithAuth(email);
    if (doctor && doctor.password) {
        const passwordIsValid = await bcrypt.compare(password, doctor.password);

        if (passwordIsValid) {
            console.log('Login bem-sucedido para médico:', doctor.id);
            await createSession({ userId: doctor.id, role: 'doctor' });
            console.log('Sessão criada para médico, redirecionando...');
            redirectPath = '/doctor';
        } else {
            console.log('Senha inválida para médico');
        }
    }

    if (!redirectPath) {
        console.log('Verificando paciente...');
        const patient = await getPatientByEmailWithAuth(email);
        if (patient && patient.password) {
            const passwordIsValid = await bcrypt.compare(password, patient.password);

            if (passwordIsValid) {
                 console.log('Login bem-sucedido para paciente:', patient.id);
                 await createSession({ userId: patient.id, role: 'patient' });
                 console.log('Sessão criada para paciente, redirecionando...');
                 redirectPath = '/patient/dashboard';
            }
        } else {
            console.log('Paciente não encontrado ou sem senha');
        }
    }
    
    if (redirectPath) {
        // O redirect é tratado como uma exceção no Next.js
        // Não precisa de try-catch aqui, apenas redirecionar
        redirect(redirectPath);
    }

    // Generic error message for security reasons
    return {
      ...prevState,
      message: 'E-mail ou senha inválidos.',
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
