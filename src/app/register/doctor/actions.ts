'use server';

import { addDoctorWithAuth, getDoctorByEmail, getDoctorByCrm } from '@/lib/db-adapter';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { generateVerificationToken, getTokenExpiry, sendVerificationEmail } from '@/lib/email-service';
import { saveUploadedFile } from '@/lib/file-storage';
import type { Doctor } from '@/types';

const DoctorSchema = z.object({
  fullName: z.string().min(3, { message: "O nome completo é obrigatório." }),
  crm: z.string().min(4, { message: "O CRM deve ter no mínimo 4 caracteres." }),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  specialty: z.string().min(1, { message: "A especialidade é obrigatória." }),
  city: z.string().min(2, { message: "A cidade é obrigatória." }),
  state: z.string().length(2, { message: "O estado (UF) é obrigatório." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(1, { message: "Confirme sua senha." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export async function createDoctorAction(prevState: any, formData: FormData) {
  // Validar documento
  const documentFile = formData.get('document') as File | null;

  if (!documentFile || documentFile.size === 0) {
    return {
      ...prevState,
      message: 'Por favor, envie um documento de identificação (CRM ou RG).',
      errors: { document: ['Documento obrigatório.'] }
    };
  }

  // Validar tamanho (max 5MB)
  if (documentFile.size > 5 * 1024 * 1024) {
    return {
      ...prevState,
      message: 'O documento deve ter no máximo 5MB.',
      errors: { document: ['Arquivo muito grande.'] }
    };
  }

  const validatedFields = DoctorSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Erro de validação. Por favor, corrija os campos destacados.',
    };
  }

  const { fullName, email, password, specialty, crm, cpf, birthDate, phone, city, state } = validatedFields.data;

  try {
    // Salvar documento
    const documentUrl = await saveUploadedFile(documentFile, 'documents');

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
      cpf: cpf || null,
      birthDate: birthDate || null,
      phone: phone || null,
      email: email,
      emailVerified: false,
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
      isApproved: false,
      verificationDocument: documentUrl,
    } as Omit<Doctor, 'id'>, hashedPassword, verificationToken, tokenExpiry);

    // Enviar email de verificação
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.REPLIT_DOMAINS?.split(',')[0]
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000');

    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}&type=doctor`;

    console.log('[Cadastro Médico] Enviando email de verificação...');
    console.log('[Cadastro Médico] Para:', email);
    console.log('[Cadastro Médico] URL de verificação:', verificationUrl);

    const emailSent = await sendVerificationEmail({
      to: email,
      name: fullName,
      verificationUrl,
    });

    if (!emailSent) {
      console.warn('[Cadastro Médico] ⚠️ Email de verificação não foi enviado, mas cadastro prosseguiu');
    } else {
      console.log('[Cadastro Médico] ✅ Email de verificação enviado com sucesso');
    }

    revalidatePath('/doctor/patients');
    return {
      ...prevState,
      message: `✅ Cadastro realizado com sucesso!\n\n📧 Próximos Passos:\n1. Verifique sua caixa de entrada (${email}) e clique no link de ativação que enviamos.\n2. Após validar seu email, aguarde a aprovação do seu cadastro pela equipe administrativa.\n\n⏱️ O processo de aprovação pode levar até 48 horas úteis. Você receberá um email quando seu acesso for liberado.`,
      errors: null,
      success: true,
    };

  } catch (e) {
    console.error("Failed to create doctor:", e);
    return { ...prevState, message: 'Falha ao criar médico no banco de dados.' };
  }
}