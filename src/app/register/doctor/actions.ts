
'use server';

import { addDoctorWithAuth, getDoctorByEmail } from '@/lib/firestore-admin-adapter';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const DoctorSchema = z.object({
  fullName: z.string().min(3, { message: "O nome completo é obrigatório." }),
  crm: z.string().min(5, { message: "O CRM é obrigatório." }),
  specialty: z.string().min(1, { message: "A especialidade é obrigatória." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

export async function createDoctorAction(prevState: any, formData: FormData) {
  const validatedFields = DoctorSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Erro de validação. Por favor, corrija os campos destacados.',
    };
  }
  
  const { fullName, email, password, specialty, crm } = validatedFields.data;

  try {
    const existingDoctor = await getDoctorByEmail(email);
    if (existingDoctor) {
        return {
            ...prevState,
            errors: { email: ['Este e-mail já está em uso.'] },
            message: 'Falha no cadastro. O e-mail fornecido já está cadastrado.',
        };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await addDoctorWithAuth({
      name: fullName,
      email: email,
      specialty: specialty,
      online: false,
      avatar: 'https://placehold.co/128x128.png',
      avatarHint: 'person portrait',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      validations: 0,
      badges: [],
    }, hashedPassword);

    revalidatePath('/doctor/patients');
    return {
      ...prevState,
      message: 'Cadastro de médico realizado com sucesso! Você será redirecionado para a página de login.',
      errors: null,
      success: true,
    };

  } catch (e) {
    console.error("Failed to create doctor:", e);
    return { ...prevState, message: 'Falha ao criar médico no banco de dados.' };
  }
}
