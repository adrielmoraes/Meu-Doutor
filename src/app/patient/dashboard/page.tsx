import PatientDashboardImproved from "@/components/patient/patient-dashboard-improved";
import { getPatientById, getAllExamsForWellnessPlan } from "@/lib/db-adapter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { Patient } from "@/types";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from '../../../../server/storage';
import { appointments } from '../../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { Suspense } from 'react';
import UsageSummary from '@/components/patient/usage-summary';

interface DashboardData {
    patient: Patient | null;
    examCount: number;
    upcomingAppointments: number;
    error?: string;
}

async function getDashboardData(patientId: string): Promise<DashboardData> {
    try {
        const patient = await getPatientById(patientId);
        if (!patient) {
             return { patient: null, examCount: 0, upcomingAppointments: 0, error: `Paciente com ID "${patientId}" não encontrado. Verifique se os dados iniciais foram carregados ou se o ID está correto.` };
        }

        const exams = await getAllExamsForWellnessPlan(patientId);
        const examCount = exams.length;

        const upcomingAppointmentsData = await db
          .select()
          .from(appointments)
          .where(
            and(
              eq(appointments.patientId, patientId),
              eq(appointments.status, 'Agendada')
            )
          );

        return { patient, examCount, upcomingAppointments: upcomingAppointmentsData.length };
    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = e.code?.toLowerCase() || '';

        if (errorMessage.includes('connection') || errorCode.includes('not-found')) {
            return { 
                patient: null,
                examCount: 0,
                upcomingAppointments: 0,
                error: "Não foi possível conectar ao banco de dados. Verifique se o banco de dados está configurado corretamente."
            };
        }
        console.error("Unexpected dashboard error:", e);
        return { patient: null, examCount: 0, upcomingAppointments: 0, error: "Ocorreu um erro inesperado ao carregar os dados do painel." };
    }
}


export default async function PatientDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
      redirect('/login');
  }

  const { patient, examCount, upcomingAppointments, error } = await getDashboardData(session.userId);

  return (
    <>
        {error || !patient ? (
           <div className="container mx-auto p-8">
               <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 text-red-200">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Erro de Configuração ou Conexão</AlertTitle>
                   <AlertDescription>
                       {error}
                   </AlertDescription>
               </Alert>
           </div>
        ) : (
            <div className="space-y-6">
              <Suspense fallback={<div>Carregando...</div>}>
                <UsageSummary />
              </Suspense>
              <Suspense fallback={<div>Carregando...</div>}>
                <PatientDashboardImproved 
                  patient={patient} 
                  examCount={examCount}
                  upcomingAppointments={upcomingAppointments}
                />
              </Suspense>
            </div>
        )}
    </>
  );
}