
import PatientDashboard from "@/components/patient/patient-dashboard";
import { getPatientById } from "@/lib/firestore-admin-adapter";
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
        const patient = await getPatientById(patientId);
        if (!patient) {
             return { patient: null, healthInsights: null, error: `Paciente com ID "${patientId}" não encontrado. Verifique se os dados iniciais foram carregados ou se o ID está correto.` };
        }

        const healthInsights = (patient.healthGoals && patient.healthGoals.length > 0 && patient.preventiveAlerts && patient.preventiveAlerts.length > 0) ? {
            healthGoals: patient.healthGoals,
            preventiveAlerts: patient.preventiveAlerts,
        } : null;

        return { patient, healthInsights };
    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = e.code?.toLowerCase() || '';
        
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
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen">
        {error || !patient ? (
           <div className="container mx-auto">
               <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 text-red-200">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Erro de Configuração ou Conexão</AlertTitle>
                   <AlertDescription>
                       {error}
                       {fixUrl && (
                           <p className="mt-2">
                               Por favor, habilite a API manualmente visitando o seguinte link e clicando em "Habilitar":
                               <br />
                               <Link href={fixUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline text-cyan-400 hover:text-cyan-300">
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
