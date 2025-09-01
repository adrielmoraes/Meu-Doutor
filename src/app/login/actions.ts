
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
    const doctor = await getDoctorByEmailWithAuth(email);
    if (doctor && doctor.password) {
        const passwordIsValid = await bcrypt.compare(password, doctor.password);

        if (passwordIsValid) {
            await createSession({ userId: doctor.id, role: 'doctor' });
            redirectPath = '/doctor';
        } else {
            // Do not reveal if the user exists, just say invalid credentials for the doctor part
        }
    }

    if (!redirectPath) {
        const patient = await getPatientByEmailWithAuth(email);
        if (patient && patient.password) {
            const passwordIsValid = await bcrypt.compare(password, patient.password);

            if (passwordIsValid) {
                 await createSession({ userId: patient.id, role: 'patient' });
                 redirectPath = '/patient/dashboard';
            }
        }
    }
    
    if (redirectPath) {
        redirect(redirectPath);
    }

    // Generic error message for security reasons
    return {
      ...prevState,
      message: 'E-mail ou senha inválidos.',
    };

  } catch (error) {
    console.error('Login error:', error);
    // Handle redirect errors specifically
    if ((error as any).code === 'NEXT_REDIRECT') {
        throw error;
    }
    return {
      ...prevState,
      message: 'Ocorreu um erro no servidor. Por favor, tente novamente.',
    };
  }
}
