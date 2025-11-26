import DoctorDashboardImproved from "@/components/doctor/doctor-dashboard-improved";
import { getDoctorById } from "@/lib/db-adapter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { Doctor, Appointment, Patient } from "@/types";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from '../../../server/storage';
import { appointments, consultations, exams, patients } from '../../../shared/schema';
import { eq, and, count, sql, gte, desc, or } from 'drizzle-orm';

interface PendingExam {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  date: string;
  createdAt: Date;
}

interface UrgentCase {
  id: string;
  name: string;
  priority: string;
  lastVisit: string | null;
  avatar: string;
  pendingExams: number;
}

interface TodayAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar: string | null;
  time: string;
  type: string;
  status: string;
}

interface DashboardData {
    doctor: Doctor | null;
    totalPatients: number;
    upcomingAppointments: number;
    completedConsultations: number;
    pendingExams: PendingExam[];
    pendingExamsCount: number;
    urgentCases: UrgentCase[];
    todayAppointments: TodayAppointment[];
    avgValidationTime: number;
    weeklyConsultations: number;
    error?: string;
}

async function getDashboardData(doctorId: string): Promise<DashboardData> {
    const emptyData: DashboardData = {
      doctor: null,
      totalPatients: 0,
      upcomingAppointments: 0,
      completedConsultations: 0,
      pendingExams: [],
      pendingExamsCount: 0,
      urgentCases: [],
      todayAppointments: [],
      avgValidationTime: 0,
      weeklyConsultations: 0,
    };

    try {
        const doctor = await getDoctorById(doctorId);
        if (!doctor) {
             return { 
               ...emptyData,
               error: `Médico com ID "${doctorId}" não encontrado.` 
             };
        }

        const today = new Date().toISOString().split('T')[0];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [
          totalPatientsResult,
          upcomingAppointmentsResult,
          completedConsultationsResult,
          pendingExamsResult,
          urgentPatientsResult,
          todayAppointmentsResult,
          weeklyConsultationsResult
        ] = await Promise.all([
          db.select({ count: sql<number>`COUNT(DISTINCT ${appointments.patientId})` })
            .from(appointments)
            .where(eq(appointments.doctorId, doctorId)),
          
          db.select({ count: count() })
            .from(appointments)
            .where(
              and(
                eq(appointments.doctorId, doctorId),
                eq(appointments.status, 'Agendada')
              )
            ),
          
          db.select({ count: count() })
            .from(consultations)
            .where(eq(consultations.doctorId, doctorId)),
          
          db.select({
              id: exams.id,
              patientId: exams.patientId,
              type: exams.type,
              date: exams.date,
              createdAt: exams.createdAt,
              patientName: patients.name,
            })
            .from(exams)
            .innerJoin(patients, eq(exams.patientId, patients.id))
            .innerJoin(appointments, eq(patients.id, appointments.patientId))
            .where(
              and(
                eq(appointments.doctorId, doctorId),
                eq(exams.status, 'Requer Validação')
              )
            )
            .orderBy(desc(exams.createdAt))
            .limit(10),
          
          db.select({
              id: patients.id,
              name: patients.name,
              priority: patients.priority,
              lastVisit: patients.lastVisit,
              avatar: patients.avatar,
            })
            .from(patients)
            .innerJoin(appointments, eq(patients.id, appointments.patientId))
            .where(
              and(
                eq(appointments.doctorId, doctorId),
                or(
                  eq(patients.priority, 'Crítica'),
                  eq(patients.priority, 'Alta')
                )
              )
            )
            .limit(5),
          
          db.select({
              id: appointments.id,
              patientId: appointments.patientId,
              patientName: appointments.patientName,
              patientAvatar: appointments.patientAvatar,
              time: appointments.time,
              type: appointments.type,
              status: appointments.status,
            })
            .from(appointments)
            .where(
              and(
                eq(appointments.doctorId, doctorId),
                eq(appointments.date, today),
                eq(appointments.status, 'Agendada')
              )
            )
            .orderBy(appointments.time),
          
          db.select({ count: count() })
            .from(consultations)
            .where(
              and(
                eq(consultations.doctorId, doctorId),
                gte(consultations.createdAt, new Date(oneWeekAgo))
              )
            ),
        ]);

        const urgentCasesWithExams = await Promise.all(
          urgentPatientsResult.map(async (p) => {
            const pendingExamsCount = await db
              .select({ count: count() })
              .from(exams)
              .where(
                and(
                  eq(exams.patientId, p.id),
                  eq(exams.status, 'Requer Validação')
                )
              );
            return {
              ...p,
              priority: p.priority || 'Normal',
              pendingExams: Number(pendingExamsCount[0]?.count) || 0,
            };
          })
        );

        return { 
          doctor,
          totalPatients: Number(totalPatientsResult[0]?.count) || 0,
          upcomingAppointments: Number(upcomingAppointmentsResult[0]?.count) || 0,
          completedConsultations: Number(completedConsultationsResult[0]?.count) || 0,
          pendingExams: pendingExamsResult.map(e => ({
            id: e.id,
            patientId: e.patientId,
            patientName: e.patientName,
            type: e.type,
            date: e.date,
            createdAt: e.createdAt,
          })),
          pendingExamsCount: pendingExamsResult.length,
          urgentCases: urgentCasesWithExams,
          todayAppointments: todayAppointmentsResult,
          avgValidationTime: 24,
          weeklyConsultations: Number(weeklyConsultationsResult[0]?.count) || 0,
        };
    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = e.code?.toLowerCase() || '';
        
        if (errorMessage.includes('connection') || errorCode.includes('not-found')) {
            return { 
                ...emptyData,
                error: "Não foi possível conectar ao banco de dados. Verifique se o banco de dados está configurado corretamente."
            };
        }
        console.error("Unexpected dashboard error:", e);
        return { 
          ...emptyData,
          error: "Ocorreu um erro inesperado ao carregar os dados do painel." 
        };
    }
}

export default async function DoctorDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
      redirect('/login');
  }

  const dashboardData = await getDashboardData(session.userId);

  return (
    <>
        {dashboardData.error || !dashboardData.doctor ? (
           <div className="container mx-auto p-8">
               <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 text-red-200">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Erro de Configuração ou Conexão</AlertTitle>
                   <AlertDescription>
                       {dashboardData.error}
                   </AlertDescription>
               </Alert>
           </div>
        ) : (
            <DoctorDashboardImproved 
              doctor={dashboardData.doctor}
              totalPatients={dashboardData.totalPatients}
              upcomingAppointments={dashboardData.upcomingAppointments}
              completedConsultations={dashboardData.completedConsultations}
              pendingExams={dashboardData.pendingExams}
              pendingExamsCount={dashboardData.pendingExamsCount}
              urgentCases={dashboardData.urgentCases}
              todayAppointments={dashboardData.todayAppointments}
              avgValidationTime={dashboardData.avgValidationTime}
              weeklyConsultations={dashboardData.weeklyConsultations}
            />
        )}
    </>
  );
}
