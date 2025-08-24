
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDoctors } from "@/lib/firestore-adapter";
import ScheduleAppointment from "@/components/patient/schedule-appointment";
import StartConsultation from "@/components/patient/start-consultation";

export default async function DoctorsPage() {
  const doctors = await getDoctors();

  return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Consultar um Médico Humano</h1>
          <p className="text-muted-foreground">
            Conecte-se com médicos qualificados para validar seu diagnóstico.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doctor => (
            <Card key={doctor.id} className="flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={doctor.avatar} data-ai-hint={doctor.avatarHint} />
                    <AvatarFallback>{doctor.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{doctor.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
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
          ))}
        </div>
      </div>
  );
}
