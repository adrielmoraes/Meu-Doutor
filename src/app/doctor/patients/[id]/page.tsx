import { summarizePatientHistory } from "@/ai/flows/summarize-patient-history";
import PatientDetailView from "@/components/doctor/patient-detail-view";
import { getPatientById, getExamsByPatientId } from "@/lib/db-adapter";
import { notFound } from "next/navigation";
import { triageUrgency } from "@/ai/flows/triage-urgency-flow";
import { getSession } from "@/lib/session";
import { logDataAccess } from "@/lib/security-audit";
import { headers } from "next/headers";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patientData = await getPatientById(id);

  if (!patientData) {
    notFound();
  }

  // --- COMPLIANCE & AUDIT START ---
  // Register access to sensitive patient data
  try {
    const session = await getSession();
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    if (session && (session.role === 'doctor' || session.role === 'admin')) {
      // Async call without awaiting to not block UI rendering
      logDataAccess({
        accessorId: session.userId,
        accessorType: session.role,
        accessorEmail: 'doctor-session', // We might not have email in session payload, can be skipped
        dataOwnerId: id,
        dataOwnerType: 'patient',
        dataType: 'medical_records',
        dataId: id,
        accessType: 'view',
        purpose: 'Clinical Review - Doctor Dashboard',
        ipAddress: ip,
        userAgent: userAgent,
      }).catch(err => console.error('[Compliance] Failed to log data access:', err));
    }
  } catch (error) {
    console.error('[Compliance] Audit system error:', error);
    // Silent fail to not break clinical flow, but flagged in logs
  }
  // --- COMPLIANCE & AUDIT END ---

  const exams = await getExamsByPatientId(id);

  // Triage urgency is now less relevant here, as validation is per-exam.
  // We can keep the patient-level priority for sorting the main list.
  const historySummary = await summarizePatientHistory({
    conversationHistory: patientData.conversationHistory || "Nenhum histórico de conversa.",
    reportedSymptoms: patientData.reportedSymptoms || "Nenhum sintoma reportado.",
    patientId: id,
  });


  return (
    <PatientDetailView
      patient={patientData}
      summary={historySummary.summary}
      exams={exams}
    />
  );
}
