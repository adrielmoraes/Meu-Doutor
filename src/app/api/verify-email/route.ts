
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

    if (!token || !type) {
      console.error('❌ Token ou tipo ausente');
      return NextResponse.json({ 
        success: false, 
        error: 'missing_params',
        message: 'Token ou tipo de usuário ausente' 
      }, { status: 400 });
    }

    // Buscar o token no banco - SEM filtro de expiração primeiro
    let tokenRecord: any = null;
    let userEmail: string | null = null;

    console.log('🔍 Buscando token no banco de dados...');

    // Primeiro, tentar encontrar o token em patients (sem verificar expiração)
    const patientResult = await db
      .select()
      .from(patients)
      .where(eq(patients.verificationToken, token))
      .limit(1);

    if (patientResult.length > 0) {
      tokenRecord = {
        identifier: patientResult[0].email,
        expires: patientResult[0].tokenExpiry,
        type: 'patient',
        emailVerified: patientResult[0].emailVerified,
        id: patientResult[0].id
      };
      userEmail = patientResult[0].email;
      console.log('✅ Token encontrado em pacientes:', { email: userEmail, emailVerified: patientResult[0].emailVerified });
    } else {
      // Se não encontrado em patients, tentar doctors
      const doctorResult = await db
        .select()
        .from(doctors)
        .where(eq(doctors.verificationToken, token))
        .limit(1);
      
      if (doctorResult.length > 0) {
        tokenRecord = {
          identifier: doctorResult[0].email,
          expires: doctorResult[0].tokenExpiry,
          type: 'doctor',
          emailVerified: doctorResult[0].emailVerified,
          id: doctorResult[0].id
        };
        userEmail = doctorResult[0].email;
        console.log('✅ Token encontrado em médicos:', { email: userEmail, emailVerified: doctorResult[0].emailVerified });
      }
    }

    if (!tokenRecord) {
      console.error('❌ Token não encontrado no banco de dados - pode ter sido já utilizado e removido');
      return NextResponse.json({ 
        success: false, 
        error: 'invalid',
        message: 'Token de verificação inválido ou já foi utilizado. Se você já verificou seu email, faça login normalmente.' 
      }, { status: 404 });
    }

    // Verificar se já foi verificado
    if (tokenRecord.emailVerified) {
      console.log('✅ Email já verificado anteriormente para:', tokenRecord.identifier);
      
      // Limpar o token mesmo que já verificado
      if (tokenRecord.type === 'patient') {
        await db.update(patients).set({ verificationToken: null, tokenExpiry: null }).where(eq(patients.id, tokenRecord.id));
      } else if (tokenRecord.type === 'doctor') {
        await db.update(doctors).set({ verificationToken: null, tokenExpiry: null }).where(eq(doctors.id, tokenRecord.id));
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Email já verificado anteriormente. Você pode fazer login.' 
      });
    }

    // Verificar expiração
    if (!tokenRecord.expires || new Date(tokenRecord.expires) < new Date()) {
      console.error('❌ Token expirado:', {
        expires: tokenRecord.expires,
        now: new Date().toISOString()
      });

      // Deletar token expirado
      if (tokenRecord.type === 'patient') {
        await db.update(patients).set({ verificationToken: null, tokenExpiry: null }).where(eq(patients.id, tokenRecord.id));
      } else if (tokenRecord.type === 'doctor') {
        await db.update(doctors).set({ verificationToken: null, tokenExpiry: null }).where(eq(doctors.id, tokenRecord.id));
      }

      return NextResponse.json({ 
        success: false, 
        error: 'expired',
        message: 'Token de verificação expirado. Faça login novamente para receber um novo link.' 
      }, { status: 410 });
    }

    // Verificar tipo
    if (tokenRecord.type !== type) {
      console.error('❌ Tipo incorreto:', {
        expected: type,
        actual: tokenRecord.type
      });
      return NextResponse.json({ 
        success: false, 
        error: 'invalid',
        message: 'Tipo de usuário não corresponde ao token' 
      }, { status: 400 });
    }

    const email = tokenRecord.identifier;
    const userId = tokenRecord.id;
    console.log('✅ Verificando usuário:', email);

    // Atualizar usuário baseado no tipo
    if (type === 'patient') {
      await db
        .update(patients)
        .set({ 
          emailVerified: true, 
          verificationToken: null, 
          tokenExpiry: null, 
          updatedAt: new Date() 
        })
        .where(eq(patients.id, userId));
      console.log('✅ Paciente verificado com sucesso:', userId);
    } else if (type === 'doctor') {
      await db
        .update(doctors)
        .set({ 
          emailVerified: true, 
          verificationToken: null, 
          tokenExpiry: null, 
          updatedAt: new Date() 
        })
        .where(eq(doctors.id, userId));
      console.log('✅ Médico verificado com sucesso:', userId);
    }

    console.log('🗑️ Token limpo após verificação');

    return NextResponse.json({ 
      success: true,
      message: 'Email verificado com sucesso! Redirecionando para login...' 
    });
  } catch (error) {
    console.error('❌ Erro na verificação de email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'server_error',
      message: 'Erro no servidor. Tente novamente mais tarde.' 
    }, { status: 500 });
  }
}
