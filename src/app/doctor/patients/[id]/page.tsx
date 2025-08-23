import { summarizePatientHistory } from "@/ai/flows/summarize-patient-history";
import { generatePreliminaryDiagnosis } from "@/ai/flows/generate-preliminary-diagnosis";
import PatientDetailView from "@/components/doctor/patient-detail-view";
import { getPatientById } from "@/lib/firestore-adapter";
import { notFound } from "next/navigation";

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const patientData = await getPatientById(params.id);

  if (!patientData) {
    notFound();
  }

  const historySummary = await summarizePatientHistory({
    conversationHistory: patientData.conversationHistory,
    reportedSymptoms: patientData.reportedSymptoms,
  });

  const preliminaryDiagnosis = await generatePreliminaryDiagnosis({
      examResults: patientData.examResults,
      patientHistory: historySummary.summary,
  });


  return (
    <PatientDetailView
      patient={patientData}
      summary={historySummary.summary}
      diagnosis={preliminaryDiagnosis}
    />
  );
}
