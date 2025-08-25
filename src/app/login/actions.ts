
'use server';

import { getDoctorByEmail, getPatientByEmail } from '@/lib/firestore-adapter';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db } from '@/lib/firebase-admin';

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
    if (!db) {
        throw new Error("Conexão com o banco de dados não inicializada.");
    }
    const doctor = await getDoctorByEmail(email);
    if (doctor) {
        const doctorAuthDoc = await db.collection('doctorAuth').doc(doctor.id).get();
        if (!doctorAuthDoc.exists) {
            return { ...prevState, message: 'Credenciais de autenticação não encontradas para o médico.' };
        }
        const hashedPassword = doctorAuthDoc.data()?.password;
        const passwordIsValid = await bcrypt.compare(password, hashedPassword);

      if (passwordIsValid) {
          redirect('/doctor');
      } else {
          return { ...prevState, message: 'Senha incorreta para o médico.' };
      }
    }

    const patient = await getPatientByEmail(email);
    if (patient) {
        const patientAuthDoc = await db.collection('patientAuth').doc(patient.id).get();
         if (!patientAuthDoc.exists) {
            return { ...prevState, message: 'Credenciais de autenticação não encontradas para o paciente.' };
        }
        const hashedPassword = patientAuthDoc.data()?.password;
        const passwordIsValid = await bcrypt.compare(password, hashedPassword);

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
