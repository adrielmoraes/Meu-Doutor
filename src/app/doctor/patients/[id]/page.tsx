import { summarizePatientHistory } from "@/ai/flows/summarize-patient-history";
import { generatePreliminaryDiagnosis } from "@/ai/flows/generate-preliminary-diagnosis";
import PatientDetailView from "@/components/doctor/patient-detail-view";

const patientData = {
  id: '1',
  name: 'Carlos Andrade',
  age: 45,
  gender: 'Masculino',
  lastVisit: '2024-08-15',
  conversationHistory: 'Paciente relatou sentir-se cansado com frequência e ter falta de ar ao subir escadas. Mencionou que seu pai teve problemas cardíacos.',
  reportedSymptoms: 'Cansaço, falta de ar',
  examResults: "Exame de Sangue - Colesterol Total: 220 mg/dL, LDL: 140 mg/dL, HDL: 45 mg/dL, Triglicerídeos: 180 mg/dL.",
};

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch patient data based on params.id
  // Here we use mock data.

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
