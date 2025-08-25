
'use server';

import { getDoctorByEmail, getPatientByEmail } from '@/lib/firestore-adapter';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }), // Basic check for prototype
});


export async function loginAction(prevState: any, formData: FormData) {
  const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email } = validatedFields.data;

  try {
    // Check if the user is a doctor first
    const doctor = await getDoctorByEmail(email);
    if (doctor) {
      // In a real app, you would verify the password here.
      // For the prototype, we assume if the email exists, login is successful.
      redirect('/doctor');
    }

    // If not a doctor, check if the user is a patient
    const patient = await getPatientByEmail(email);
    if (patient) {
      // Real app: verify password
      // For prototype: redirect to the main landing page.
      redirect('/');
    }

    // If no user is found
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
