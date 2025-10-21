
'use server';

import { addDoctorWithAuth, getDoctorByEmail, getDoctorByCrm } from '@/lib/db-adapter';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { generateVerificationToken, getTokenExpiry, sendVerificationEmail } from '@/lib/email-service';

const DoctorSchema = z.object({
  fullName: z.string().min(3, { message: "O nome completo é obrigatório." }),
  crm: z.string().min(5, { message: "O CRM é obrigatório." }),
  specialty: z.string().min(1, { message: "A especialidade é obrigatória." }),
  city: z.string().min(2, { message: "A cidade é obrigatória." }),
  state: z.string().length(2, { message: "O estado (UF) é obrigatório." }),
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
  
  const { fullName, email, password, specialty, crm, city, state } = validatedFields.data;

  try {
    // Verificar se email já existe
    const existingEmail = await getDoctorByEmail(email);
    if (existingEmail) {
        return {
            ...prevState,
            errors: { email: ['Este e-mail já está em uso.'] },
            message: 'Falha no cadastro. O e-mail fornecido já está cadastrado.',
        };
    }

    // Verificar se CRM já existe
    const existingCrm = await getDoctorByCrm(crm);
    if (existingCrm) {
        return {
            ...prevState,
            errors: { crm: ['Este CRM já está cadastrado.'] },
            message: 'Falha no cadastro. Este CRM já está cadastrado no sistema.',
        };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    const doctorId = await addDoctorWithAuth({
      name: fullName,
      crm: crm,
      email: email,
      specialty: specialty,
      city: city,
      state: state.toUpperCase(),
      online: false,
      avatar: 'https://placehold.co/128x128.png',
      avatarHint: 'person portrait',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      validations: 0,
      badges: [],
    }, hashedPassword, verificationToken, tokenExpiry);

    // Enviar email de verificação
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.REPLIT_DOMAINS?.split(',')[0] 
                      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
                      : 'http://localhost:5000');
    
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}&type=doctor`;
    
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
    console.error("Failed to create doctor:", e);
    return { ...prevState, message: 'Falha ao criar médico no banco de dados.' };
  }
}
