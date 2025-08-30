import { summarizePatientHistory } from "@/ai/flows/summarize-patient-history";
import { generatePreliminaryDiagnosis } from "@/ai/flows/generate-preliminary-diagnosis";
import PatientDetailView from "@/components/doctor/patient-detail-view";
import { getPatientById, updatePatient } from "@/lib/firestore-adapter";
import { notFound } from "next/navigation";
import { triageUrgency } from "@/ai/flows/triage-urgency-flow";

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const patientData = await getPatientById(params.id);

  if (!patientData) {
    notFound();
  }

  // Only generate a new diagnosis and priority if the patient hasn't been validated yet.
  // This prevents re-running the AI flows every time a validated patient's page is visited.
  if (patientData.status !== 'Validado') {
      const historySummary = await summarizePatientHistory({
        conversationHistory: patientData.conversationHistory,
        reportedSymptoms: patientData.reportedSymptoms,
      });

      const preliminaryDiagnosis = await generatePreliminaryDiagnosis({
          examResults: patientData.examResults,
          patientHistory: historySummary.summary,
      });

      const urgencyAssessment = await triageUrgency({
          diagnosisSynthesis: preliminaryDiagnosis.synthesis,
      });

      // Update the patient record in the background with the new AI-generated data
      // We don't need to `await` this, as it can happen async. The UI will show the new data on next load.
      updatePatient(params.id, {
          priority: urgencyAssessment.priority
      });

      // Pass the fresh data directly to the component for immediate display
      return (
        <PatientDetailView
          patient={{...patientData, priority: urgencyAssessment.priority}}
          summary={historySummary.summary}
          diagnosis={preliminaryDiagnosis}
        />
      );
  }

  // For already validated patients, we can generate a mock diagnosis object
  // as the AI analysis section is less relevant.
  const mockDiagnosis = {
      synthesis: patientData.doctorNotes || "Diagnóstico já validado.",
      suggestions: "O plano de bem-estar já foi gerado e enviado ao paciente.",
      structuredFindings: []
  };
  
  const mockSummary = "O histórico do paciente e as interações com a IA já foram consolidados no diagnóstico final do médico."


  return (
    <PatientDetailView
      patient={patientData}
      summary={mockSummary}
      diagnosis={mockDiagnosis}
    />
  );
}
