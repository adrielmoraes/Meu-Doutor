import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../server/storage';
import { patients, doctors } from '../../../../shared/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { token, type } = await request.json();

    if (!token || !type) {
      return NextResponse.json(
        { error: 'Token e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    if (type === 'patient') {
      const result = await db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.verificationToken, token),
            gt(patients.tokenExpiry, new Date())
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
          emailVerified: true,
          verificationToken: null,
          tokenExpiry: null,
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
            eq(doctors.verificationToken, token),
            gt(doctors.tokenExpiry, new Date())
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
          emailVerified: true,
          verificationToken: null,
          tokenExpiry: null,
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
    console.error('Erro ao verificar email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
