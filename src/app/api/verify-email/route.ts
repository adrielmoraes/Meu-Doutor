import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../server/storage';
import { patients, doctors } from '../../../../shared/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { token, type } = await request.json();

    console.log('[Verificação Email] Iniciando verificação...');
    console.log('[Verificação Email] Token recebido:', token?.substring(0, 16) + '...');
    console.log('[Verificação Email] Tipo:', type);

    if (!token || !type) {
      console.error('[Verificação Email] ❌ Parâmetros faltando');
      return NextResponse.json(
        { error: 'Token e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    const now = new Date();
    console.log('[Verificação Email] Data atual:', now.toISOString());

    if (type === 'patient') {
      console.log('[Verificação Email] Buscando paciente com token...');
      
      // Primeiro, buscar qualquer paciente com este token (sem verificar expiração)
      const allResults = await db
        .select()
        .from(patients)
        .where(eq(patients.verificationToken, token))
        .limit(1);

      if (!allResults[0]) {
        console.error('[Verificação Email] ❌ Token não encontrado no banco de dados');
        return NextResponse.json(
          { error: 'Token inválido. Por favor, solicite um novo email de verificação.' },
          { status: 400 }
        );
      }

      console.log('[Verificação Email] Token encontrado para:', allResults[0].email);
      console.log('[Verificação Email] Token expira em:', allResults[0].tokenExpiry?.toISOString());
      console.log('[Verificação Email] Email já verificado?', allResults[0].emailVerified);

      // Verificar se o email já foi verificado
      if (allResults[0].emailVerified) {
        console.log('[Verificação Email] ✅ Email já estava verificado anteriormente');
        return NextResponse.json({ 
          success: true,
          message: 'Email já verificado anteriormente' 
        });
      }

      // Verificar expiração
      if (allResults[0].tokenExpiry && allResults[0].tokenExpiry <= now) {
        console.error('[Verificação Email] ❌ Token expirado');
        console.error('[Verificação Email] Expirou em:', allResults[0].tokenExpiry.toISOString());
        console.error('[Verificação Email] Data atual:', now.toISOString());
        return NextResponse.json(
          { error: 'Token expirado. Por favor, solicite um novo email de verificação.' },
          { status: 400 }
        );
      }

      // Atualizar paciente
      console.log('[Verificação Email] Atualizando paciente...');
      await db
        .update(patients)
        .set({
          emailVerified: true,
          verificationToken: null,
          tokenExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(patients.id, allResults[0].id));

      console.log('[Verificação Email] ✅ Paciente verificado com sucesso!');
      return NextResponse.json({ success: true });

    } else if (type === 'doctor') {
      console.log('[Verificação Email] Buscando médico com token...');
      
      // Primeiro, buscar qualquer médico com este token (sem verificar expiração)
      const allResults = await db
        .select()
        .from(doctors)
        .where(eq(doctors.verificationToken, token))
        .limit(1);

      if (!allResults[0]) {
        console.error('[Verificação Email] ❌ Token não encontrado no banco de dados');
        return NextResponse.json(
          { error: 'Token inválido. Por favor, solicite um novo email de verificação.' },
          { status: 400 }
        );
      }

      console.log('[Verificação Email] Token encontrado para:', allResults[0].email);
      console.log('[Verificação Email] Token expira em:', allResults[0].tokenExpiry?.toISOString());
      console.log('[Verificação Email] Email já verificado?', allResults[0].emailVerified);

      // Verificar se o email já foi verificado
      if (allResults[0].emailVerified) {
        console.log('[Verificação Email] ✅ Email já estava verificado anteriormente');
        return NextResponse.json({ 
          success: true,
          message: 'Email já verificado anteriormente' 
        });
      }

      // Verificar expiração
      if (allResults[0].tokenExpiry && allResults[0].tokenExpiry <= now) {
        console.error('[Verificação Email] ❌ Token expirado');
        console.error('[Verificação Email] Expirou em:', allResults[0].tokenExpiry.toISOString());
        console.error('[Verificação Email] Data atual:', now.toISOString());
        return NextResponse.json(
          { error: 'Token expirado. Por favor, solicite um novo email de verificação.' },
          { status: 400 }
        );
      }

      // Atualizar médico
      console.log('[Verificação Email] Atualizando médico...');
      await db
        .update(doctors)
        .set({
          emailVerified: true,
          verificationToken: null,
          tokenExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(doctors.id, allResults[0].id));

      console.log('[Verificação Email] ✅ Médico verificado com sucesso!');
      return NextResponse.json({ success: true });

    } else {
      console.error('[Verificação Email] ❌ Tipo inválido:', type);
      return NextResponse.json(
        { error: 'Tipo inválido' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Verificação Email] ❌ Erro crítico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor. Por favor, tente novamente.' },
      { status: 500 }
    );
  }
}
