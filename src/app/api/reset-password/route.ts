
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../server/storage';
import { patients, doctors } from '../../../../shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { token, type, password } = await request.json();

    if (!token || !type || !password) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (type === 'patient') {
      const result = await db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.resetPasswordToken, token),
            gt(patients.resetPasswordExpiry, new Date())
          )
        )
        .limit(1);

      if (!result[0]) {
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 400 }
        );
      }

      await db
        .update(patients)
        .set({
          passwordHash: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(patients.id, result[0].id));

      return NextResponse.json({ success: true });
    } else if (type === 'doctor') {
      const result = await db
        .select()
        .from(doctors)
        .where(
          and(
            eq(doctors.resetPasswordToken, token),
            gt(doctors.resetPasswordExpiry, new Date())
          )
        )
        .limit(1);

      if (!result[0]) {
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 400 }
        );
      }

      await db
        .update(doctors)
        .set({
          passwordHash: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(doctors.id, result[0].id));

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Tipo inválido' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
