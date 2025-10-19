
// REMOVER: 'use client';

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllAppointmentsForDoctor, getDoctorById } from '@/lib/db-adapter';
import type { Appointment, Doctor } from "@/types"; // Importar Doctor type
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from 'next/navigation'; // Importar redirect de next/navigation
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import ManageAvailability from '@/components/doctor/manage-availability';
import ScheduleCalendarManager from '@/components/doctor/schedule-calendar-manager'; // Importar o novo componente
import CancelAppointmentButton from '@/components/ui/cancel-appointment-button'; // Importar CancelAppointmentButton
import StartVideoCallButton from '@/components/doctor/start-video-call-button';


async function getScheduleData(doctorId: string): Promise<{ appointments: Appointment[], doctor: Doctor | null, error?: string, fixUrl?: string }> {
    try {
        console.log('[SchedulePage Debug] Buscando agendamentos para Doctor ID:', doctorId);
        const appointments = await getAllAppointmentsForDoctor(doctorId);
        console.log('[SchedulePage Debug] Agendamentos recebidos (bruto):', appointments);

        // Validar que `appointments` é um array antes de tentar filtrar
        if (!Array.isArray(appointments)) {
            console.error('[SchedulePage Debug] Erro: getAllAppointmentsForDoctor não retornou um array.', appointments);
            return { appointments: [], doctor: null, error: "Formato de dados de agendamentos inválido." };
        }

        // Validar cada agendamento para garantir que 'date' existe
        const validatedAppointments = appointments.map(appt => {
            if (!appt.date || !appt.time || !appt.patientName) {
                console.warn('[SchedulePage Debug] Agendamento malformado encontrado, ignorando:', appt);
                return null; // Retorna null para agendamentos inválidos
            }
            return appt; // Retorna agendamento válido
        }).filter(Boolean) as Appointment[]; // Filtra os nulos

        // Obter os dados do médico para a disponibilidade
        const doctor = await getDoctorById(doctorId);
        if (!doctor) {
            console.error('[SchedulePage Debug] Erro: Doutor não encontrado com o ID:', doctorId);
            return { appointments: [], doctor: null, error: "Perfil do médico não encontrado para carregar a agenda." };
        }

        return { appointments: validatedAppointments, doctor };
    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = (typeof e.code === 'string' ? e.code.toLowerCase() : '') || '';
        
        console.error('[SchedulePage Debug] Erro inesperado em getScheduleData:', e);
        console.error('[SchedulePage Debug] Tipo do erro:', typeof e, 'Erro completo:', e);

        if (errorMessage.includes('connection') || errorCode.includes('not-found')) {
            return { 
                appointments: [], doctor: null,
                error: "Não foi possível conectar ao banco de dados. Verifique se o banco de dados está configurado corretamente."
            };
        }
        // Para outros erros, retornar uma mensagem mais genérica
        return { appointments: [], doctor: null, error: "Ocorreu um erro inesperado ao carregar os agendamentos." };
    }
}


export default async function SchedulePage() {
  const session = await getSession();
  console.log('[SchedulePage Debug] Sessão do Médico:', session ? `ID: ${session.userId}, Role: ${session.role}` : 'Nenhuma sessão');

  if (!session || session.role !== 'doctor') {
      redirect('/login');
  }

  if (!session.userId) {
      console.error('[SchedulePage Debug] Erro: session.userId é nulo ou indefinido.', session);
      return (
         <div className="container mx-auto">
             <Alert variant="destructive">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Erro de Sessão</AlertTitle>
                 <AlertDescription>Não foi possível obter o ID do médico logado para carregar a agenda.</AlertDescription>
             </Alert>
         </div>
      );
  }

  const { appointments, doctor, error, fixUrl } = await getScheduleData(session.userId); // Passar o ID do doutor logado

  // Filtrar agendamentos por Hoje, Esta Semana, Este Mês
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const todaysAppointments = Array.isArray(appointments)
    ? appointments.filter(appt => isToday(parseISO(appt.date)))
    : [];

  const thisWeekAppointments = Array.isArray(appointments)
    ? appointments.filter(appt => isThisWeek(parseISO(appt.date)) && !isToday(parseISO(appt.date))) // Exclui os de hoje
    : [];

  const thisMonthAppointments = Array.isArray(appointments)
    ? appointments.filter(appt => isThisMonth(parseISO(appt.date)) && !isThisWeek(parseISO(appt.date))) // Exclui os da semana
    : [];


  if (error || !doctor) {
     return (
        <div className="container mx-auto">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro de Configuração ou Conexão</AlertTitle>
                <AlertDescription>
                       {error || 'Não foi possível carregar os dados do médico.'}
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
        );
  }

  const renderAppointmentList = (apts: Appointment[]) => (
    <ul className="space-y-4">
        {apts.length > 0 ? (
            apts.map(appt => (
                <Card key={appt.id} className="p-4 flex items-center gap-4 transition-all hover:shadow-md">
                    <Avatar>
                        <AvatarImage src={appt.patientAvatar} />
                        <AvatarFallback>{appt.patientName.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <p className="font-semibold text-lg">{appt.time} - {appt.patientName}</p>
                        <p className="text-sm text-muted-foreground">{appt.type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(appt.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    {appt.status === 'Agendada' && appt.type.includes('Vídeo') && (
                        <StartVideoCallButton 
                            patientId={appt.patientId}
                            appointmentId={appt.id}
                            patientName={appt.patientName}
                        />
                    )}
                    <CancelAppointmentButton appointment={appt} />
                </Card>
            ))
        ) : (
            <li className="text-center text-muted-foreground py-4">
                Nenhuma consulta encontrada.
            </li>
        )}
    </ul>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agenda e Disponibilidade</h1>
        <p className="text-muted-foreground">
          Visualize suas consultas e gerencie seus horários de atendimento.
        </p>
      </div>
      {/* Renderizar o novo Client Component com o calendário unificado */}
      <ScheduleCalendarManager appointments={appointments} doctor={doctor} />
    </div>
  );
}
