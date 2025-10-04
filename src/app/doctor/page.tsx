import DoctorDashboardImproved from "@/components/doctor/doctor-dashboard-improved";
import { getDoctorById } from "@/lib/db-adapter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { Doctor } from "@/types";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from '../../../server/storage';
import { appointments, consultations } from '../../../shared/schema';
import { eq, and, count, sql } from 'drizzle-orm';

interface DashboardData {
    doctor: Doctor | null;
    totalPatients: number;
    upcomingAppointments: number;
    completedConsultations: number;
    error?: string;
}

async function getDashboardData(doctorId: string): Promise<DashboardData> {
    try {
        const doctor = await getDoctorById(doctorId);
        if (!doctor) {
             return { 
               doctor: null, 
               totalPatients: 0, 
               upcomingAppointments: 0,
               completedConsultations: 0,
               error: `Médico com ID "${doctorId}" não encontrado.` 
             };
        }

        const totalPatientsResult = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${appointments.patientId})` })
          .from(appointments)
          .where(eq(appointments.doctorId, doctorId));

        const upcomingAppointmentsResult = await db
          .select({ count: count() })
          .from(appointments)
          .where(
            and(
              eq(appointments.doctorId, doctorId),
              eq(appointments.status, 'Agendada')
            )
          );

        const completedConsultationsResult = await db
          .select({ count: count() })
          .from(consultations)
          .where(eq(consultations.doctorId, doctorId));

        return { 
          doctor,
          totalPatients: Number(totalPatientsResult[0]?.count) || 0,
          upcomingAppointments: Number(upcomingAppointmentsResult[0]?.count) || 0,
          completedConsultations: Number(completedConsultationsResult[0]?.count) || 0
        };
    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = e.code?.toLowerCase() || '';
        
        if (errorMessage.includes('connection') || errorCode.includes('not-found')) {
            return { 
                doctor: null,
                totalPatients: 0,
                upcomingAppointments: 0,
                completedConsultations: 0,
                error: "Não foi possível conectar ao banco de dados. Verifique se o banco de dados está configurado corretamente."
            };
        }
        console.error("Unexpected dashboard error:", e);
        return { 
          doctor: null, 
          totalPatients: 0, 
          upcomingAppointments: 0,
          completedConsultations: 0,
          error: "Ocorreu um erro inesperado ao carregar os dados do painel." 
        };
    }
}

export default async function DoctorDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
      redirect('/login');
  }

  const { doctor, totalPatients, upcomingAppointments, completedConsultations, error } = await getDashboardData(session.userId);

  return (
    <>
        {error || !doctor ? (
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
            <DoctorDashboardImproved 
              doctor={doctor}
              totalPatients={totalPatients}
              upcomingAppointments={upcomingAppointments}
              completedConsultations={completedConsultations}
            />
        )}
    </>
  );
}
