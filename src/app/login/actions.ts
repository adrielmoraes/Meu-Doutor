
'use server';

import { getDoctorByEmailWithAuth, getPatientByEmailWithAuth } from '@/lib/firestore-adapter';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcrypt';

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
    const doctor = await getDoctorByEmailWithAuth(email);
    if (doctor && doctor.password) {
        const passwordIsValid = await bcrypt.compare(password, doctor.password);

        if (passwordIsValid) {
            redirect('/doctor');
        } else {
            return { ...prevState, message: 'Senha incorreta para o médico.' };
        }
    }

    const patient = await getPatientByEmailWithAuth(email);
    if (patient && patient.password) {
        const passwordIsValid = await bcrypt.compare(password, patient.password);

        if (passwordIsValid) {
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
