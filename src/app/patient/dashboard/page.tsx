
import PatientDashboard from "@/components/patient/patient-dashboard";
import { getPatientById } from "@/lib/firestore-adapter";
import type { GenerateHealthInsightsOutput } from "@/ai/flows/generate-health-insights";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Patient } from "@/types";

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

interface DashboardData {
    patient: Patient | null;
    healthInsights: GenerateHealthInsightsOutput | null;
    error?: string;
    fixUrl?: string;
}

async function getDashboardData(): Promise<DashboardData> {
    try {
        const patient = await getPatientById(MOCK_PATIENT_ID);
        if (!patient) {
             return { patient: null, healthInsights: null, error: "Paciente não encontrado. Verifique se os dados iniciais foram carregados no Firestore." };
        }

        // The health insights are now read directly from the patient object,
        // as they are generated and saved upon diagnosis validation by the doctor.
        const healthInsights = (patient.healthGoals && patient.preventiveAlerts) ? {
            healthGoals: patient.healthGoals,
            preventiveAlerts: patient.preventiveAlerts,
        } : null;

        return { patient, healthInsights };
    } catch (e: any) {
        if (e.message?.includes('5 NOT_FOUND') || e.code?.includes('not-found')) {
            const firestoreApiUrl = `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;
            return { 
                patient: null,
                healthInsights: null,
                error: "Não foi possível conectar ao banco de dados. A API do Cloud Firestore pode estar desativada.",
                fixUrl: firestoreApiUrl 
            };
        }
        console.error("Unexpected dashboard error:", e);
        return { patient: null, healthInsights: null, error: "Ocorreu um erro inesperado ao carregar os dados do painel." };
    }
}


export default async function PatientDashboardPage() {
  const { patient, healthInsights, error, fixUrl } = await getDashboardData();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        {error || !patient ? (
           <div className="container mx-auto">
               <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Erro de Configuração ou Conexão</AlertTitle>
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
            <PatientDashboard patient={patient} healthInsights={healthInsights} />
        )}
      </div>
  );
}
