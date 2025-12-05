import { NextRequest, NextResponse } from 'next/server';
import { getPaymentSettings } from '@/app/admin/settings/actions';

export async function GET(req: NextRequest) {
  try {
    const settings = await getPaymentSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao obter configurações de pagamento:', error);
    return NextResponse.json(
      { pixEnabled: false },
      { status: 200 } // Retorna false como padrão seguro
    );
  }
}
