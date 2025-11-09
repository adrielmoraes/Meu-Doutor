import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../server/storage';
import { patients, doctors } from '../../../../shared/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type') as 'patient' | 'doctor';

    console.log('🔍 Verificando email:', { token: token?.substring(0, 10) + '...', type });

    if (!token || !type) {
      console.error('❌ Token ou tipo ausente');
      // Assuming there's a base URL or domain to redirect to
      // For demonstration, using a placeholder. In a real app, this would be configured.
      const baseUrl = request.url.split('/verify-email')[0]; // Basic way to get base URL
      return NextResponse.redirect(
        new URL(`${baseUrl}/verify-email?error=missing_params`, request.url)
      );
    }

    // Buscar o token no banco
    // This part needs to be adapted based on how your db adapter works.
    // The original code directly queried 'patients' or 'doctors'.
    // The new code implies a helper function `db.getVerificationToken`.
    // For this example, let's assume a direct query mimicking the original structure for now,
    // but ideally, this should use the provided `db` from the snippet.

    let tokenRecord: any = null;
    let userEmail: string | null = null;

    // First, try to find the token in patients
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
      // If not found in patients, try doctors
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
      const baseUrl = request.url.split('/verify-email')[0];
      return NextResponse.redirect(
        new URL(`${baseUrl}/verify-email?error=invalid`, request.url)
      );
    }

    // Verificar expiração (already handled by gt in where clause, but good for explicit logging)
    if (new Date(tokenRecord.expires) < new Date()) {
      console.error('❌ Token expirado:', {
        expires: tokenRecord.expires,
        now: new Date().toISOString()
      });

      // Deletar token expirado - This logic needs to be adapted to the original schema
      if (tokenRecord.type === 'patient') {
        await db.update(patients).set({ verificationToken: null, tokenExpiry: null }).where(eq(patients.email, tokenRecord.identifier));
      } else if (tokenRecord.type === 'doctor') {
        await db.update(doctors).set({ verificationToken: null, tokenExpiry: null }).where(eq(doctors.email, tokenRecord.identifier));
      }

      const baseUrl = request.url.split('/verify-email')[0];
      return NextResponse.redirect(
        new URL(`${baseUrl}/verify-email?error=expired`, request.url)
      );
    }

    // Verificar tipo
    if (tokenRecord.type !== type) {
      console.error('❌ Tipo incorreto:', {
        expected: type,
        actual: tokenRecord.type
      });
      const baseUrl = request.url.split('/verify-email')[0];
      return NextResponse.redirect(
        new URL(`${baseUrl}/verify-email?error=invalid`, request.url)
      );
    }

    const email = tokenRecord.identifier;
    console.log('✅ Verificando usuário:', email);

    // Atualizar usuário baseado no tipo
    if (type === 'patient') {
      // Ensure patient exists and is not already verified (though token check implicitly handles this if tokens are unique per verification)
      const patient = await db.select().from(patients).where(eq(patients.email, email)).limit(1);
      if (patient.length === 0) {
        console.error('❌ Paciente não encontrado:', email);
        const baseUrl = request.url.split('/verify-email')[0];
        return NextResponse.redirect(
          new URL(`${baseUrl}/verify-email?error=user_not_found`, request.url)
        );
      }
      // Check if already verified to avoid unnecessary update and log
      if(patient[0].emailVerified) {
        console.log('✅ Email já verificado anteriormente para:', email);
        const baseUrl = request.url.split('/verify-email')[0];
        return NextResponse.redirect(
          new URL(`${baseUrl}/verify-email?success=true&type=${type}&message=already_verified`, request.url)
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
        const baseUrl = request.url.split('/verify-email')[0];
        return NextResponse.redirect(
          new URL(`${baseUrl}/verify-email?error=user_not_found`, request.url)
        );
      }
      // Check if already verified
      if(doctor[0].emailVerified) {
        console.log('✅ Email já verificado anteriormente para:', email);
        const baseUrl = request.url.split('/verify-email')[0];
        return NextResponse.redirect(
          new URL(`${baseUrl}/verify-email?success=true&type=${type}&message=already_verified`, request.url)
        );
      }

      await db
        .update(doctors)
        .set({ emailVerified: true, verificationToken: null, tokenExpiry: null, updatedAt: new Date() })
        .where(eq(doctors.id, doctor[0].id));
      console.log('✅ Médico verificado:', doctor[0].id);
    }

    // Deletar token usado - handled by setting to null above. If a separate token table was used, deletion would happen here.
    console.log('🗑️ Token limpo após verificação');

    // Redirecionar para página de sucesso
    const baseUrl = request.url.split('/verify-email')[0];
    return NextResponse.redirect(
      new URL(`${baseUrl}/verify-email?success=true&type=${type}`, request.url)
    );
  } catch (error) {
    console.error('❌ Erro na verificação de email:', error);
    const baseUrl = request.url.split('/verify-email')[0];
    return NextResponse.redirect(
      new URL(`${baseUrl}/verify-email?error=server_error`, request.url)
    );
  }
}