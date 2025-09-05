
'use client'; // Tornar Client Component para usar useState

import { useState } from 'react'; // Importar useState
import PatientDashboard from "@/components/patient/patient-dashboard";
import { getPatientById } from "@/lib/firestore-admin-adapter"; // Importar getPatientById do admin-adapter
import type { GenerateHealthInsightsOutput } from "@/ai/flows/generate-health-insights";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Patient } from "@/types";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AvatarUpload from '@/components/ui/avatar-upload'; // Importar AvatarUpload
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Importar Card

interface DashboardData {
    patient: Patient | null;
    healthInsights: GenerateHealthInsightsOutput | null;
    error?: string;
    fixUrl?: string;
}

// Mover esta função para um Server Action ou adaptar para ser chamada do cliente
// Por enquanto, ela será chamada uma vez no Server Component para carregar os dados iniciais
// e o Cliente Component vai gerenciar as interações.
async function getDashboardDataClient(patientId: string): Promise<DashboardData> {
    // Esta função será usada apenas para a pré-renderização inicial do servidor
    // ou se o Client Component precisar recarregar todos os dados do paciente.
    // As interações de upload serão feitas via a rota /api/upload-avatar.
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

// Este componente agora é um Client Component
function PatientDashboardClientPage({ initialPatient, initialHealthInsights, initialError, initialFixUrl }: {
  initialPatient: Patient | null;
  initialHealthInsights: GenerateHealthInsightsOutput | null;
  initialError?: string;
  initialFixUrl?: string;
}) {
  const [patient, setPatient] = useState<Patient | null>(initialPatient);
  const [healthInsights] = useState<GenerateHealthInsightsOutput | null>(initialHealthInsights);
  const [error] = useState<string | undefined>(initialError);
  const [fixUrl] = useState<string | undefined>(initialFixUrl);

  const handleAvatarUploadSuccess = (newUrl: string) => {
    if (patient) {
      setPatient({ ...patient, avatar: newUrl });
    }
  };

  if (error || !patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
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
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card with Avatar Upload */}
        <Card className="md:col-span-1 flex flex-col items-center p-6">
          <CardHeader className="text-center w-full">
            <AvatarUpload 
                currentAvatarUrl={patient.avatar || null} 
                fallbackText={patient.name.substring(0, 2).toUpperCase()} 
                onUploadSuccess={handleAvatarUploadSuccess}
            />
            <CardTitle className="mt-4 text-2xl">{patient.name}</CardTitle>
            <CardDescription>{patient.email}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow text-center w-full">
            {/* Outras informações do perfil do paciente podem ir aqui */}
            <p className="text-sm text-muted-foreground">CPF: {patient.cpf}</p>
            <p className="text-sm text-muted-foreground">Telefone: {patient.phone}</p>
          </CardContent>
        </Card>

        {/* Existing PatientDashboard content */}
        <div className="md:col-span-2">
            <PatientDashboard patient={patient} healthInsights={healthInsights} />
        </div>
      </div>
    </div>
  );
}

// Server Component Wrapper para carregar dados inicialmente
export default async function PatientDashboardPageWrapper() {
    const session = await getSession();
    if (!session || session.role !== 'patient') {
        redirect('/login');
    }
    const { patient, healthInsights, error, fixUrl } = await getDashboardDataClient(session.userId); // Chamada inicial do servidor

    return (
        <PatientDashboardClientPage 
            initialPatient={patient} 
            initialHealthInsights={healthInsights} 
            initialError={error} 
            initialFixUrl={fixUrl} 
        />
    );
}
