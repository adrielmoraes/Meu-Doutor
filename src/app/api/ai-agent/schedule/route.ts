import { NextRequest, NextResponse } from "next/server";
import { scheduleAppointment, getAvailableSlots } from "@/lib/scheduling";
import { getPatientById } from "@/lib/db-adapter";

function sanitizeErrorMessage(error: Error): string {
  const safeMessages = [
    'Horário não disponível',
    'Médico não encontrado',
    'Paciente não encontrado',
    'Data inválida',
    'Horário inválido'
  ];
  
  for (const msg of safeMessages) {
    if (error.message.includes(msg)) {
      return msg;
    }
  }
  
  return 'Erro ao processar solicitação';
}

/**
 * API para o agente IA agendar consultas e verificar disponibilidade
 * LGPD/HIPAA Compliant - Com validações de segurança
 * POST /api/ai-agent/schedule - Agendar consulta
 * GET /api/ai-agent/schedule?doctorId=xxx&date=2024-11-15 - Ver horários disponíveis
 */
export async function POST(request: NextRequest) {
  try {
    const agentSecret = request.headers.get("x-agent-secret");
    
    if (!agentSecret || agentSecret !== process.env.AGENT_SECRET) {
      console.warn("[Schedule API] Tentativa de acesso não autorizado");
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { doctorId, patientId, patientName, date, startTime, endTime, type, notes } = body;

    if (!doctorId || !patientId || !patientName || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    if (!/^[\w-]+$/.test(doctorId) || !/^[\w-]+$/.test(patientId)) {
      console.warn("[Schedule API] IDs suspeitos detectados");
      return NextResponse.json(
        { error: "Formato de ID inválido" },
        { status: 400 }
      );
    }

    const patient = await getPatientById(patientId);

    if (!patient) {
      console.warn(`[Schedule API] Tentativa de agendar para paciente inexistente`);
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    const appointmentDate = new Date(date);
    
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: "Data inválida" },
        { status: 400 }
      );
    }

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

    console.log(`[Schedule API] ✅ Consulta agendada: ${appointmentId.substring(0, 8)}...`);

    return NextResponse.json({
      success: true,
      appointmentId,
      message: `Consulta agendada para ${date} às ${startTime}`,
    });
  } catch (error) {
    console.error("[Schedule API] Erro interno:", error instanceof Error ? error.constructor.name : 'Unknown');
    
    if (error instanceof Error) {
      const sanitizedMessage = sanitizeErrorMessage(error);
      return NextResponse.json(
        { error: sanitizedMessage },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const agentSecret = request.headers.get("x-agent-secret");
    
    if (!agentSecret || agentSecret !== process.env.AGENT_SECRET) {
      console.warn("[Schedule API] Tentativa de acesso não autorizado (GET)");
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
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    if (!/^[\w-]+$/.test(doctorId)) {
      console.warn("[Schedule API] ID suspeito detectado (GET)");
      return NextResponse.json(
        { error: "Formato de ID inválido" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Data inválida" },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(doctorId, date, 30);
    const availableSlots = slots.filter(slot => slot.available);

    return NextResponse.json({
      success: true,
      date: dateStr,
      availableSlots: availableSlots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
      totalAvailable: availableSlots.length,
    });
  } catch (error) {
    console.error("[Schedule API] Erro interno (GET):", error instanceof Error ? error.constructor.name : 'Unknown');
    
    if (error instanceof Error) {
      const sanitizedMessage = sanitizeErrorMessage(error);
      return NextResponse.json(
        { error: sanitizedMessage },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
