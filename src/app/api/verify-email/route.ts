
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../server/storage';
import { patients, doctors } from '../../../../shared/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type') as 'patient' | 'doctor';

    console.log('🔍 [VERIFY-EMAIL] Iniciando verificação');
    console.log('🔍 [VERIFY-EMAIL] Token recebido:', token);
    console.log('🔍 [VERIFY-EMAIL] Tipo:', type);

    if (!token || !type) {
      console.error('❌ [VERIFY-EMAIL] Token ou tipo ausente');
      return NextResponse.json({ 
        success: false, 
        error: 'missing_params',
        message: 'Token ou tipo de usuário ausente' 
      }, { status: 400 });
    }

    // Buscar o token no banco baseado no tipo especificado
    let tokenRecord: any = null;
    let userEmail: string | null = null;

    console.log(`🔍 [VERIFY-EMAIL] Buscando token em ${type}s...`);

    if (type === 'patient') {
      const patientResult = await db
        .select()
        .from(patients)
        .where(eq(patients.verificationToken, token))
        .limit(1);

      console.log('🔍 [VERIFY-EMAIL] Resultado busca patients:', {
        found: patientResult.length > 0,
        count: patientResult.length
      });

      if (patientResult.length > 0) {
        const patient = patientResult[0];
        tokenRecord = {
          identifier: patient.email,
          expires: patient.tokenExpiry,
          type: 'patient',
          emailVerified: patient.emailVerified,
          id: patient.id
        };
        userEmail = patient.email;
        console.log('✅ [VERIFY-EMAIL] Token encontrado em pacientes:', {
          id: patient.id,
          email: userEmail,
          emailVerified: patient.emailVerified,
          tokenExpiry: patient.tokenExpiry,
          hasToken: !!patient.verificationToken
        });
      }
    } else if (type === 'doctor') {
      const doctorResult = await db
        .select()
        .from(doctors)
        .where(eq(doctors.verificationToken, token))
        .limit(1);
      
      console.log('🔍 [VERIFY-EMAIL] Resultado busca doctors:', {
        found: doctorResult.length > 0,
        count: doctorResult.length
      });

      if (doctorResult.length > 0) {
        const doctor = doctorResult[0];
        tokenRecord = {
          identifier: doctor.email,
          expires: doctor.tokenExpiry,
          type: 'doctor',
          emailVerified: doctor.emailVerified,
          id: doctor.id
        };
        userEmail = doctor.email;
        console.log('✅ [VERIFY-EMAIL] Token encontrado em médicos:', {
          id: doctor.id,
          email: userEmail,
          emailVerified: doctor.emailVerified,
          tokenExpiry: doctor.tokenExpiry,
          hasToken: !!doctor.verificationToken
        });
      }
    }

    if (!tokenRecord) {
      console.error('❌ [VERIFY-EMAIL] Token não encontrado no banco de dados');
      console.error('❌ [VERIFY-EMAIL] Token buscado:', token);
      console.error('❌ [VERIFY-EMAIL] Tipo:', type);
      console.error('❌ [VERIFY-EMAIL] Possíveis causas:');
      console.error('  1. Token já foi usado e removido do banco');
      console.error('  2. Token expirou e foi removido');
      console.error('  3. Token nunca foi salvo no banco (erro no cadastro)');
      console.error('  4. URL de verificação está incorreta');
      
      return NextResponse.json({ 
        success: false, 
        error: 'invalid',
        message: 'Token de verificação inválido ou já utilizado. Se você já verificou seu email, faça login normalmente.' 
      }, { status: 404 });
    }

    console.log('✅ [VERIFY-EMAIL] Token encontrado, verificando status...');

    // Verificar se já foi verificado
    if (tokenRecord.emailVerified) {
      console.log('⚠️ [VERIFY-EMAIL] Email já verificado anteriormente:', tokenRecord.identifier);
      
      // Limpar o token mesmo que já verificado
      if (tokenRecord.type === 'patient') {
        await db.update(patients)
          .set({ verificationToken: null, tokenExpiry: null })
          .where(eq(patients.id, tokenRecord.id));
      } else if (tokenRecord.type === 'doctor') {
        await db.update(doctors)
          .set({ verificationToken: null, tokenExpiry: null })
          .where(eq(doctors.id, tokenRecord.id));
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Email já verificado anteriormente. Você pode fazer login.' 
      });
    }

    // Verificar expiração
    const now = new Date();
    const expiryDate = tokenRecord.expires ? new Date(tokenRecord.expires) : null;
    
    console.log('🕐 [VERIFY-EMAIL] Verificando expiração:', {
      now: now.toISOString(),
      expires: expiryDate?.toISOString(),
      isExpired: expiryDate ? expiryDate < now : true
    });

    if (!expiryDate || expiryDate < now) {
      console.error('❌ [VERIFY-EMAIL] Token expirado');
      console.error('❌ [VERIFY-EMAIL] Data de expiração:', expiryDate?.toISOString());
      console.error('❌ [VERIFY-EMAIL] Data atual:', now.toISOString());
      console.error('❌ [VERIFY-EMAIL] Diferença em minutos:', expiryDate ? Math.floor((now.getTime() - expiryDate.getTime()) / 60000) : 'N/A');

      // Deletar token expirado
      if (tokenRecord.type === 'patient') {
        await db.update(patients)
          .set({ verificationToken: null, tokenExpiry: null })
          .where(eq(patients.id, tokenRecord.id));
      } else if (tokenRecord.type === 'doctor') {
        await db.update(doctors)
          .set({ verificationToken: null, tokenExpiry: null })
          .where(eq(doctors.id, tokenRecord.id));
      }

      return NextResponse.json({ 
        success: false, 
        error: 'expired',
        message: 'Token de verificação expirado. Faça login novamente para receber um novo link.' 
      }, { status: 410 });
    }

    // Verificar tipo
    if (tokenRecord.type !== type) {
      console.error('❌ [VERIFY-EMAIL] Tipo incorreto:', {
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
    console.log('✅ [VERIFY-EMAIL] Tudo OK, verificando usuário:', email);

    // Atualizar usuário baseado no tipo
    if (type === 'patient') {
      const result = await db
        .update(patients)
        .set({ 
          emailVerified: true, 
          verificationToken: null, 
          tokenExpiry: null, 
          updatedAt: new Date() 
        })
        .where(eq(patients.id, userId));
      console.log('✅ [VERIFY-EMAIL] Paciente verificado com sucesso:', userId);
    } else if (type === 'doctor') {
      const result = await db
        .update(doctors)
        .set({ 
          emailVerified: true, 
          verificationToken: null, 
          tokenExpiry: null, 
          updatedAt: new Date() 
        })
        .where(eq(doctors.id, userId));
      console.log('✅ [VERIFY-EMAIL] Médico verificado com sucesso:', userId);
    }

    console.log('🎉 [VERIFY-EMAIL] Verificação concluída com sucesso!');

    return NextResponse.json({ 
      success: true,
      message: 'Email verificado com sucesso! Redirecionando para login...' 
    });
  } catch (error) {
    console.error('❌ [VERIFY-EMAIL] Erro crítico:', error);
    console.error('❌ [VERIFY-EMAIL] Stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json({ 
      success: false, 
      error: 'server_error',
      message: 'Erro no servidor. Tente novamente mais tarde.' 
    }, { status: 500 });
  }
}
