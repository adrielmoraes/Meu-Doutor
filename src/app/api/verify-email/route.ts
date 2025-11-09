
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../server/storage';
import { patients, doctors } from '../../../../shared/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type') as 'patient' | 'doctor';

    console.log('🔍 Verificando email:', { token: token?.substring(0, 10) + '...', type });

    // Usar a URL do frontend (Vercel)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sejafelizsempre.com';

    if (!token || !type) {
      console.error('❌ Token ou tipo ausente');
      return NextResponse.redirect(
        `${baseUrl}/verify-email?error=missing_params`
      );
    }

    // Buscar o token no banco
    let tokenRecord: any = null;
    let userEmail: string | null = null;

    // Primeiro, tentar encontrar o token em patients
    const patientResult = await db
      .select()
      .from(patients)
      .where(and(eq(patients.verificationToken, token), gt(patients.tokenExpiry, new Date())))
      .limit(1);

    if (patientResult.length > 0) {
      tokenRecord = {
        identifier: patientResult[0].email,
        expires: patientResult[0].tokenExpiry,
        type: 'patient',
        emailVerified: patientResult[0].emailVerified
      };
      userEmail = patientResult[0].email;
    } else {
      // Se não encontrado em patients, tentar doctors
      const doctorResult = await db
        .select()
        .from(doctors)
        .where(and(eq(doctors.verificationToken, token), gt(doctors.tokenExpiry, new Date())))
        .limit(1);
      
      if (doctorResult.length > 0) {
        tokenRecord = {
          identifier: doctorResult[0].email,
          expires: doctorResult[0].tokenExpiry,
          type: 'doctor',
          emailVerified: doctorResult[0].emailVerified
        };
        userEmail = doctorResult[0].email;
      }
    }

    console.log('📋 Token encontrado:', {
      exists: !!tokenRecord,
      expired: tokenRecord ? new Date(tokenRecord.expires) < new Date() : null,
      type: tokenRecord?.type,
      email: tokenRecord?.identifier
    });

    if (!tokenRecord) {
      console.error('❌ Token não encontrado no banco de dados');
      return NextResponse.redirect(
        `${baseUrl}/verify-email?error=invalid`
      );
    }

    // Verificar expiração
    if (new Date(tokenRecord.expires) < new Date()) {
      console.error('❌ Token expirado:', {
        expires: tokenRecord.expires,
        now: new Date().toISOString()
      });

      // Deletar token expirado
      if (tokenRecord.type === 'patient') {
        await db.update(patients).set({ verificationToken: null, tokenExpiry: null }).where(eq(patients.email, tokenRecord.identifier));
      } else if (tokenRecord.type === 'doctor') {
        await db.update(doctors).set({ verificationToken: null, tokenExpiry: null }).where(eq(doctors.email, tokenRecord.identifier));
      }

      return NextResponse.redirect(
        `${baseUrl}/verify-email?error=expired`
      );
    }

    // Verificar tipo
    if (tokenRecord.type !== type) {
      console.error('❌ Tipo incorreto:', {
        expected: type,
        actual: tokenRecord.type
      });
      return NextResponse.redirect(
        `${baseUrl}/verify-email?error=invalid`
      );
    }

    const email = tokenRecord.identifier;
    console.log('✅ Verificando usuário:', email);

    // Atualizar usuário baseado no tipo
    if (type === 'patient') {
      const patient = await db.select().from(patients).where(eq(patients.email, email)).limit(1);
      if (patient.length === 0) {
        console.error('❌ Paciente não encontrado:', email);
        return NextResponse.redirect(
          `${baseUrl}/verify-email?error=user_not_found`
        );
      }
      
      // Verificar se já foi verificado
      if(patient[0].emailVerified) {
        console.log('✅ Email já verificado anteriormente para:', email);
        return NextResponse.redirect(
          `${baseUrl}/verify-email?success=true&type=${type}&message=already_verified`
        );
      }

      await db
        .update(patients)
        .set({ emailVerified: true, verificationToken: null, tokenExpiry: null, updatedAt: new Date() })
        .where(eq(patients.id, patient[0].id));
      console.log('✅ Paciente verificado:', patient[0].id);
    } else if (type === 'doctor') {
      const doctor = await db.select().from(doctors).where(eq(doctors.email, email)).limit(1);
      if (doctor.length === 0) {
        console.error('❌ Médico não encontrado:', email);
        return NextResponse.redirect(
          `${baseUrl}/verify-email?error=user_not_found`
        );
      }
      
      // Verificar se já foi verificado
      if(doctor[0].emailVerified) {
        console.log('✅ Email já verificado anteriormente para:', email);
        return NextResponse.redirect(
          `${baseUrl}/verify-email?success=true&type=${type}&message=already_verified`
        );
      }

      await db
        .update(doctors)
        .set({ emailVerified: true, verificationToken: null, tokenExpiry: null, updatedAt: new Date() })
        .where(eq(doctors.id, doctor[0].id));
      console.log('✅ Médico verificado:', doctor[0].id);
    }

    console.log('🗑️ Token limpo após verificação');

    // Redirecionar para página de sucesso
    return NextResponse.redirect(
      `${baseUrl}/verify-email?success=true&type=${type}`
    );
  } catch (error) {
    console.error('❌ Erro na verificação de email:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sejafelizsempre.com';
    return NextResponse.redirect(
      `${baseUrl}/verify-email?error=server_error`
    );
  }
}
