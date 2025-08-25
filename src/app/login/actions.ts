
'use server';

import { getDoctorByEmail, getPatientByEmail } from '@/lib/firestore-adapter';
import { redirect } from 'next/navigation';
import { z } from 'zod';

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

  try {
    const doctor = await getDoctorByEmail(email);
    if (doctor) {
      // For prototype: direct password comparison. In production, use a secure hash comparison.
      if (doctor.password === password) {
          redirect('/doctor');
      } else {
          return { ...prevState, message: 'Senha incorreta para o médico.' };
      }
    }

    const patient = await getPatientByEmail(email);
    if (patient) {
        // For prototype: direct password comparison. In production, use a secure hash comparison.
        if (patient.password === password) {
            redirect(`/patient/dashboard?id=${patient.id}`);
        } else {
            return { ...prevState, message: 'Senha incorreta para o paciente.' };
        }
    }

    return {
      ...prevState,
      message: 'Nenhum usuário encontrado com este e-mail.',
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      ...prevState,
      message: 'Ocorreu um erro no servidor. Por favor, tente novamente.',
    };
  }
}
