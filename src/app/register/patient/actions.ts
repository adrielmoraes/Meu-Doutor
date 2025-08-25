
'use server';

import { addPatient, getPatientByEmail } from '@/lib/firestore-adapter';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { differenceInYears } from 'date-fns';

const PatientSchema = z.object({
  fullName: z.string().min(3, { message: "O nome completo é obrigatório." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Data de nascimento inválida." }),
  cpf: z.string().min(11, { message: "CPF inválido." }),
  phone: z.string().min(10, { message: "Telefone inválido." }),
  gender: z.string().min(1, { message: "Por favor, selecione um gênero." }),
});

export async function createPatientAction(prevState: any, formData: FormData) {
  const validatedFields = PatientSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Erro de validação. Por favor, corrija os campos destacados.',
    };
  }
  
  const { fullName, birthDate, email, ...rest } = validatedFields.data;

  try {
    // Check if a patient with this email already exists
    const existingPatient = await getPatientByEmail(email);
    if (existingPatient) {
        return {
            ...prevState,
            errors: { email: ['Este e-mail já está em uso.'] },
            message: 'Falha no cadastro. O e-mail fornecido já está cadastrado.',
        };
    }

    // In a real app, you would hash the password here before saving
    await addPatient({
      name: fullName,
      birthDate: birthDate,
      age: differenceInYears(new Date(), new Date(birthDate)),
      lastVisit: new Date().toLocaleDateString('pt-BR'),
      status: 'Requer Validação', // Initial status
      avatar: 'https://placehold.co/128x128.png',
      avatarHint: 'person portrait',
      conversationHistory: '',
      reportedSymptoms: '',
      examResults: '',
      // Map the rest of the validated fields
      email: email,
      cpf: rest.cpf,
      phone: rest.phone,
      gender: rest.gender,
    });

    revalidatePath('/doctor/patients');
    // Return a success state instead of redirecting
    return {
      ...prevState,
      message: 'Cadastro realizado com sucesso! Você será redirecionado para a página de login.',
      errors: null,
      success: true,
    };

  } catch (e) {
    console.error("Failed to create patient:", e);
    return { ...prevState, message: 'Falha ao criar paciente no banco de dados.' };
  }
}
