import { NextRequest, NextResponse } from 'next/server';
import { fetchBryAuthUrl } from '@/services/signature-service';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const url = await fetchBryAuthUrl(id);
        return NextResponse.redirect(url);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
