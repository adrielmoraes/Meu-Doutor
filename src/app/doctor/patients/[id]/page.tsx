import { summarizePatientHistory } from "@/ai/flows/summarize-patient-history";
import PatientDetailView from "@/components/doctor/patient-detail-view";
import { getPatientById, getExamsByPatientId, getConsultationsByPatient } from "@/lib/db-adapter";
import { getPrescriptionsByPatient } from "@/lib/prescriptions-adapter";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { logDataAccess } from "@/lib/security-audit";
import { headers } from "next/headers";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const patientData = await getPatientById(id);

  if (!patientData) {
    notFound();
  }

  // --- COMPLIANCE & AUDIT START ---
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    if (session && (session.role === 'doctor' || session.role === 'admin')) {
      logDataAccess({
        accessorId: session.userId,
        accessorType: session.role,
        accessorEmail: 'doctor-session',
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
  }
  // --- COMPLIANCE & AUDIT END ---

  const [exams, consultations, prescriptions] = await Promise.all([
    getExamsByPatientId(id),
    getConsultationsByPatient(id),
    getPrescriptionsByPatient(id)
  ]);

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
      consultations={consultations}
      prescriptions={prescriptions}
      doctor={{ id: session?.userId }}
    />
  );
}
