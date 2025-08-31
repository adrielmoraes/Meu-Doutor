

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDoctors, getPatientById } from "@/lib/firestore-adapter";
import ScheduleAppointment from "@/components/patient/schedule-appointment";
import StartConsultation from "@/components/patient/start-consultation";
import type { Doctor, Patient } from "@/types";
import { Separator } from "@/components/ui/separator";
import { MapPin, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";


const DoctorCard = ({ doctor, patientId }: { doctor: Doctor, patientId: string }) => (
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
        <ScheduleAppointment doctor={doctor} patientId={patientId} />
        </CardContent>
    </Card>
);

async function getDoctorsPageData(patientId: string): Promise<{ localDoctors: Doctor[], otherDoctors: Doctor[], patient: Patient | null, error?: string, fixUrl?: string }> {
    try {
        const allDoctors = await getDoctors();
        const patient = await getPatientById(patientId);

        const localDoctors = patient 
            ? allDoctors.filter(d => d.city.toLowerCase() === patient.city.toLowerCase() && d.state.toLowerCase() === patient.state.toLowerCase())
            : [];
        
        const otherDoctors = patient
            ? allDoctors.filter(d => d.city.toLowerCase() !== patient.city.toLowerCase() || d.state.toLowerCase() !== patient.state.toLowerCase())
            : allDoctors;
        
        return { localDoctors, otherDoctors, patient };

    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = e.code?.toLowerCase() || '';
        
        if (errorMessage.includes('client is offline') || errorMessage.includes('5 not_found') || errorCode.includes('not-found')) {
            const firestoreApiUrl = `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;
            return { 
                localDoctors: [], otherDoctors: [], patient: null,
                error: "Não foi possível conectar ao banco de dados. A API do Cloud Firestore pode estar desativada ou o cliente está offline.",
                fixUrl: firestoreApiUrl 
            };
        }
        console.error("Unexpected error fetching doctors list:", e);
        return { localDoctors: [], otherDoctors: [], patient: null, error: "Ocorreu um erro inesperado ao carregar a lista de médicos." };
    }
}


export default async function DoctorsPage() {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
      redirect('/login');
  }

  const { localDoctors, otherDoctors, patient, error, fixUrl } = await getDoctorsPageData(session.userId);

  if (error) {
     return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
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
    )
  }

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
                    {localDoctors.map(doctor => <DoctorCard key={doctor.id} doctor={doctor} patientId={session.userId} />)}
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
                    {otherDoctors.map(doctor => <DoctorCard key={doctor.id} doctor={doctor} patientId={session.userId} />)}
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
