
'use server';

import { addPatientWithAuth, getPatientByEmail, getPatientByCpf } from '@/lib/db-adapter';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { differenceInYears } from 'date-fns';
import bcrypt from 'bcrypt';
import { generateVerificationToken, getTokenExpiry, sendVerificationEmail } from '@/lib/email-service';
import type { Patient } from '@/types';

const PatientSchema = z.object({
  fullName: z.string().min(3, { message: "O nome completo é obrigatório." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "A confirmação de senha é obrigatória." }),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Data de nascimento inválida." }),
  cpf: z.string().min(11, { message: "CPF inválido." }),
  phone: z.string().min(10, { message: "Telefone inválido." }),
  gender: z.string().min(1, { message: "Por favor, selecione um gênero." }),
  city: z.string().min(2, { message: "A cidade é obrigatória." }),
  state: z.string().length(2, { message: "O estado (UF) é obrigatório." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export async function createPatientAction(prevState: any, formData: FormData) {
  const validatedFields = PatientSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Erro de validação. Por favor, corrija os campos destacados.',
    };
  }
  
  const { fullName, birthDate, email, password, ...rest } = validatedFields.data;

  try {
    // Verificar se email já existe
    const existingEmail = await getPatientByEmail(email);
    if (existingEmail) {
        return {
            ...prevState,
            errors: { email: ['Este e-mail já está em uso.'] },
            message: 'Falha no cadastro. O e-mail fornecido já está cadastrado.',
        };
    }

    // Verificar se CPF já existe
    const existingCpf = await getPatientByCpf(rest.cpf);
    if (existingCpf) {
        return {
            ...prevState,
            errors: { cpf: ['Este CPF já está cadastrado.'] },
            message: 'Falha no cadastro. Este CPF já está cadastrado no sistema.',
        };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    const patientId = await addPatientWithAuth({
      name: fullName,
      birthDate: birthDate,
      age: differenceInYears(new Date(), new Date(birthDate)),
      lastVisit: new Date().toLocaleDateString('pt-BR'),
      status: 'Requer Validação',
      avatar: 'https://placehold.co/128x128.png',
      avatarHint: 'person portrait',
      conversationHistory: '',
      reportedSymptoms: '',
      examResults: '',
      email: email,
      emailVerified: false,
      cpf: rest.cpf,
      phone: rest.phone,
      gender: rest.gender,
      city: rest.city,
      state: rest.state.toUpperCase(),
    } as Omit<Patient, 'id'>, hashedPassword, verificationToken, tokenExpiry);

    // Enviar email de verificação
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.REPLIT_DOMAINS?.split(',')[0] 
                      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
                      : 'http://localhost:5000');
    
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}&type=patient`;
    
    await sendVerificationEmail({
      to: email,
      name: fullName,
      verificationUrl,
    });

    revalidatePath('/doctor/patients');
    return {
      ...prevState,
      message: 'Cadastro realizado com sucesso! Verifique seu email para ativar sua conta.',
      errors: null,
      success: true,
    };

  } catch (e) {
    console.error("Failed to create patient:", e);
    return { ...prevState, message: 'Falha ao criar paciente no banco de dados.' };
  }
}
