import { NextRequest, NextResponse } from "next/server";
import { scheduleAppointment, getAvailableSlots } from "@/lib/scheduling";

/**
 * API para o agente IA agendar consultas e verificar disponibilidade
 * POST /api/ai-agent/schedule - Agendar consulta
 * GET /api/ai-agent/schedule?doctorId=xxx&date=2024-11-15 - Ver horários disponíveis
 */
export async function POST(request: NextRequest) {
  try {
    const agentSecret = request.headers.get("x-agent-secret");
    
    if (!agentSecret || agentSecret !== process.env.AGENT_SECRET) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { doctorId, patientId, patientName, date, startTime, endTime, type, notes } = body;

    if (!doctorId || !patientId || !patientName || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Dados incompletos. Necessário: doctorId, patientId, patientName, date, startTime, endTime" },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(date);
    
    const appointmentId = await scheduleAppointment({
      doctorId,
      patientId,
      patientName,
      appointmentDate,
      startTime,
      endTime,
      type: type || "consultation",
      notes: notes || "",
    });

    return NextResponse.json({
      success: true,
      appointmentId,
      message: `Consulta agendada com sucesso para ${date} às ${startTime}`,
    });
  } catch (error) {
    console.error("[AI Agent API] Erro ao agendar consulta:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Erro ao agendar consulta" },
      { status: 500 }
    );
  }
}

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
    const doctorId = searchParams.get("doctorId");
    const dateStr = searchParams.get("date");

    if (!doctorId || !dateStr) {
      return NextResponse.json(
        { error: "Necessário doctorId e date (formato: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const slots = await getAvailableSlots(doctorId, date, 30);

    const availableSlots = slots.filter(slot => slot.available);

    return NextResponse.json({
      success: true,
      date: dateStr,
      doctorId,
      availableSlots: availableSlots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
      totalAvailable: availableSlots.length,
    });
  } catch (error) {
    console.error("[AI Agent API] Erro ao buscar horários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários disponíveis" },
      { status: 500 }
    );
  }
}
