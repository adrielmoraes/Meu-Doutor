
import Header from "@/components/layout/header";
import PatientDashboard from "@/components/patient/patient-dashboard";
import { getPatientById } from "@/lib/firestore-adapter";
import { generateHealthInsights } from "@/ai/flows/generate-health-insights";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

async function getDashboardData() {
    try {
        const patient = await getPatientById(MOCK_PATIENT_ID);
        if (!patient) {
            // This case handles when the patient document itself doesn't exist,
            // which is different from a connection error.
             return { error: "Paciente não encontrado. Verifique se os dados iniciais foram carregados no Firestore." };
        }

        const healthInsights = patient.status === 'Validado' && patient.doctorNotes ?
            await generateHealthInsights({
                patientHistory: patient.conversationHistory || "Nenhum histórico.",
                validatedDiagnosis: patient.doctorNotes,
            }) : null;

        return { patient, healthInsights };
    } catch (e: any) {
        if (e.message?.includes('offline')) {
            // This is the specific error from Firestore when the API is disabled.
            const firestoreApiUrl = `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${process.env.GCLOUD_PROJECT || 'mediai-7m1xp'}`;
            return { 
                error: "Não foi possível conectar ao banco de dados. A API do Cloud Firestore pode estar desativada.",
                fixUrl: firestoreApiUrl 
            };
        }
        // For other potential errors
        return { error: "Ocorreu um erro inesperado ao carregar os dados do painel." };
    }
}


export default async function Home() {
  const { patient, healthInsights, error, fixUrl } = await getDashboardData();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-muted/20 p-4 sm:p-6 lg:p-8">
        {error ? (
           <div className="container mx-auto">
               <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Erro de Configuração do Projeto</AlertTitle>
                   <AlertDescription>
                       {error}
                       {fixUrl && (
                           <p className="mt-2">
                               Por favor, habilite a API manualmente visitando o seguinte link e clicando em "Habilitar":
                               <br />
                               <Link href={fixUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                                   Habilitar API do Firestore
                               </Link>
                               <br />
                               <span className="text-xs">Após habilitar, aguarde alguns minutos e atualize esta página.</span>
                           </p>
                       )}
                   </AlertDescription>
               </Alert>
           </div>
        ) : (
            <PatientDashboard patient={patient!} healthInsights={healthInsights} />
        )}
      </main>
    </div>
  );
}
