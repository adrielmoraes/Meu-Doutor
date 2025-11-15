import { NextRequest, NextResponse } from "next/server";
import { getDoctors } from "@/lib/db-adapter";

/**
 * Endpoint de teste para verificar se a API do agente está funcionando
 * GET /api/ai-agent/test
 */
export async function GET(request: NextRequest) {
  try {
    const agentSecret = request.headers.get("x-agent-secret");
    
    if (!agentSecret || agentSecret !== process.env.AGENT_SECRET) {
      return NextResponse.json(
        { 
          error: "Não autorizado",
          hint: "Configure AGENT_SECRET nas variáveis de ambiente"
        },
        { status: 401 }
      );
    }

    const doctors = await getDoctors();

    return NextResponse.json({
      success: true,
      message: "API do agente funcionando corretamente!",
      environment: {
        hasAgentSecret: !!process.env.AGENT_SECRET,
        hasDatabase: !!process.env.DATABASE_URL,
      },
      stats: {
        totalDoctors: doctors.length,
        onlineDoctors: doctors.filter(d => d.online).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AI Agent Test] Erro:", error);
    return NextResponse.json(
      { 
        error: "Erro no servidor",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
