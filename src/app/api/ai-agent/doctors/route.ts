import { NextRequest, NextResponse } from "next/server";
import { getDoctors, getDoctorsBySpecialty } from "@/lib/db-adapter";

/**
 * API para o agente IA consultar médicos disponíveis
 * GET /api/ai-agent/doctors?specialty=cardiologia
 */
export async function GET(request: NextRequest) {
  try {
    const agentSecret = request.headers.get("x-agent-secret");
    
    if (!agentSecret || agentSecret !== process.env.AGENT_SECRET) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const specialty = searchParams.get("specialty");
    const limit = parseInt(searchParams.get("limit") || "10");

    let doctors;
    
    if (specialty) {
      doctors = await getDoctorsBySpecialty(specialty, limit);
    } else {
      doctors = await getDoctors();
    }

    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      crm: doctor.crm,
      online: doctor.online,
      bio: doctor.bio,
      experienceYears: doctor.experienceYears,
      languages: doctor.languages,
      consultationPrice: doctor.consultationPrice,
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
