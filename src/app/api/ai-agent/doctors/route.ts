import { NextRequest, NextResponse } from "next/server";
import { getDoctors, getDoctorsBySpecialty } from "@/lib/db-adapter";

function normalizeSpecialty(input: string): string {
  const normalized = input.toLowerCase().trim();
  
  const specialtyMap: Record<string, string> = {
    'cardiologista': 'Cardiologia',
    'cardiologia': 'Cardiologia',
    'clinico geral': 'Clínico Geral',
    'clínico geral': 'Clínico Geral',
    'clinica geral': 'Clínico Geral',
    'dermatologista': 'Dermatologia',
    'dermatologia': 'Dermatologia',
    'ortopedista': 'Ortopedia',
    'ortopedia': 'Ortopedia',
    'pediatra': 'Pediatria',
    'pediatria': 'Pediatria',
    'neurologista': 'Neurologia',
    'neurologia': 'Neurologia',
    'psiquiatra': 'Psiquiatria',
    'psiquiatria': 'Psiquiatria',
    'oftalmologista': 'Oftalmologia',
    'oftalmologia': 'Oftalmologia',
  };

  return specialtyMap[normalized] || input;
}

/**
 * API para o agente IA consultar médicos disponíveis
 * GET /api/ai-agent/doctors?specialty=cardiologia
 */
export async function GET(request: NextRequest) {
  try {
    const agentSecret = request.headers.get("x-agent-secret");
    const expectedSecret = process.env.AGENT_SECRET;
    
    if (!agentSecret || agentSecret !== expectedSecret) {
      console.warn("[AI Agent Doctors] Tentativa de acesso não autorizado");
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rawSpecialty = searchParams.get("specialty");
    const limit = parseInt(searchParams.get("limit") || "10");

    let doctors;
    
    if (rawSpecialty) {
      const normalizedSpecialty = normalizeSpecialty(rawSpecialty);
      console.log(`[AI Agent Doctors] Buscando: "${rawSpecialty}" → normalizado: "${normalizedSpecialty}"`);
      doctors = await getDoctorsBySpecialty(normalizedSpecialty, limit);
    } else {
      doctors = await getDoctors();
    }

    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      crm: doctor.crm,
      online: doctor.online,
      city: doctor.city,
      state: doctor.state,
      avatar: doctor.avatar,
    }));

    return NextResponse.json({
      success: true,
      doctors: formattedDoctors,
      count: formattedDoctors.length,
    });
  } catch (error) {
    console.error("[AI Agent API] Erro ao buscar médicos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar médicos" },
      { status: 500 }
    );
  }
}
