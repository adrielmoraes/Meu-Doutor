

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDoctors, getPatientById } from "@/lib/firestore-adapter";
import ScheduleAppointment from "@/components/patient/schedule-appointment";
import StartConsultation from "@/components/patient/start-consultation";
import type { Doctor } from "@/types";
import { Separator } from "@/components/ui/separator";
import { MapPin } from "lucide-react";

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

const DoctorCard = ({ doctor }: { doctor: Doctor }) => (
    <Card key={doctor.id} className="flex flex-col transform transition-transform duration-300 hover:scale-[1.03] hover:shadow-xl">
        <CardHeader className="flex-grow">
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={doctor.avatar} data-ai-hint={doctor.avatarHint} />
            <AvatarFallback>{doctor.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
            <CardTitle>{doctor.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {doctor.city}, {doctor.state}
            </div>
            <div className={`mt-1 text-xs font-semibold inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${doctor.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <span className={`h-2 w-2 rounded-full ${doctor.online ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {doctor.online ? 'Online' : 'Offline'}
            </div>
            </div>
        </div>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
        <StartConsultation doctor={doctor} type="video" />
        <StartConsultation doctor={doctor} type="voice" />
        <ScheduleAppointment doctor={doctor} />
        </CardContent>
    </Card>
);

export default async function DoctorsPage() {
  const allDoctors = await getDoctors();
  const patient = await getPatientById(MOCK_PATIENT_ID);

  const localDoctors = patient 
    ? allDoctors.filter(d => d.city.toLowerCase() === patient.city.toLowerCase() && d.state.toLowerCase() === patient.state.toLowerCase())
    : [];
  
  const otherDoctors = patient
    ? allDoctors.filter(d => d.city.toLowerCase() !== patient.city.toLowerCase() || d.state.toLowerCase() !== patient.state.toLowerCase())
    : allDoctors;

  return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Consultar um Médico Humano</h1>
          <p className="text-muted-foreground">
            Conecte-se com médicos qualificados para validar seu diagnóstico.
          </p>
        </div>

        {localDoctors.length > 0 && (
            <div className="mb-12">
                <h2 className="text-2xl font-semibold tracking-tight mb-4">Médicos na sua cidade ({patient?.city})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {localDoctors.map(doctor => <DoctorCard key={doctor.id} doctor={doctor} />)}
                </div>
            </div>
        )}

        {otherDoctors.length > 0 && (
             <div>
                <div className="relative mb-6">
                    <Separator />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-background px-4 text-sm text-muted-foreground">
                            {localDoctors.length > 0 ? 'Outros médicos disponíveis' : 'Médicos disponíveis'}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherDoctors.map(doctor => <DoctorCard key={doctor.id} doctor={doctor} />)}
                </div>
            </div>
        )}

        {localDoctors.length === 0 && otherDoctors.length === 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Nenhum médico encontrado</CardTitle>
                    <CardDescription>Não há médicos cadastrados na plataforma no momento. Por favor, volte mais tarde.</CardDescription>
                </CardHeader>
            </Card>
        )}
      </div>
  );
}
