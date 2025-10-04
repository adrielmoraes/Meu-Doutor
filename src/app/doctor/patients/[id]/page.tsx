import { summarizePatientHistory } from "@/ai/flows/summarize-patient-history";
import PatientDetailView from "@/components/doctor/patient-detail-view";
import { getPatientById, getExamsByPatientId } from "@/lib/db-adapter";
import { notFound } from "next/navigation";
import { triageUrgency } from "@/ai/flows/triage-urgency-flow";

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const patientData = await getPatientById(params.id);

  if (!patientData) {
    notFound();
  }
  
  const exams = await getExamsByPatientId(params.id);
  
  // Triage urgency is now less relevant here, as validation is per-exam.
  // We can keep the patient-level priority for sorting the main list.
  const historySummary = await summarizePatientHistory({
    conversationHistory: patientData.conversationHistory || "Nenhum histórico de conversa.",
    reportedSymptoms: patientData.reportedSymptoms || "Nenhum sintoma reportado.",
  });


  return (
    <PatientDetailView
      patient={patientData}
      summary={historySummary.summary}
      exams={exams}
    />
  );
}
