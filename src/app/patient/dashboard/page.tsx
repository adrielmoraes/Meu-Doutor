
import PatientDashboard from "@/components/patient/patient-dashboard";
import { getPatientById } from "@/lib/firestore-admin-adapter"; // Importar getPatientById do admin-adapter
import type { GenerateHealthInsightsOutput } from "@/ai/flows/generate-health-insights";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Patient } from "@/types";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

interface DashboardData {
    patient: Patient | null;
    healthInsights: GenerateHealthInsightsOutput | null;
    error?: string;
    fixUrl?: string;
}

async function getDashboardData(patientId: string): Promise<DashboardData> {
    try {
        const patient = await getPatientById(patientId); // Usar a função getPatientById diretamente
        if (!patient) {
             return { patient: null, healthInsights: null, error: `Paciente com ID "${patientId}" não encontrado. Verifique se os dados iniciais foram carregados ou se o ID está correto.` };
        }

        // The health insights are now read directly from the patient object,
        // as they are generated and saved upon diagnosis validation by the doctor.
        // This check handles new patients who don't have these fields yet.
        const healthInsights = (patient.healthGoals && patient.healthGoals.length > 0 && patient.preventiveAlerts && patient.preventiveAlerts.length > 0) ? {
            healthGoals: patient.healthGoals,
            preventiveAlerts: patient.preventiveAlerts,
        } : null;

        return { patient, healthInsights };
    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = e.code?.toLowerCase() || '';
        
        // Catches errors for both disabled API and general offline state.
        if (errorMessage.includes('client is offline') || errorMessage.includes('5 not_found') || errorCode.includes('not-found')) {
            const firestoreApiUrl = `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;
            return { 
                patient: null,
                healthInsights: null,
                error: "Não foi possível conectar ao banco de dados. A API do Cloud Firestore pode estar desativada ou o cliente está offline.",
                fixUrl: firestoreApiUrl 
            };
        }
        console.error("Unexpected dashboard error:", e);
        return { patient: null, healthInsights: null, error: "Ocorreu um erro inesperado ao carregar os dados do painel." };
    }
}


export default async function PatientDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
      redirect('/login');
  }

  const { patient, healthInsights, error, fixUrl } = await getDashboardData(session.userId);

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
                       )}\n                   </AlertDescription>
               </Alert>
           </div>
        ) : (
            <PatientDashboard patient={patient} healthInsights={healthInsights} />
        )}
      </div>
  );
}
