
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAppointments } from "@/lib/firestore-adapter";

export default async function SchedulePage() {
  const appointments = await getAppointments();

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Agenda de Consultas</h1>
          <p className="text-muted-foreground">
            Visualize seus agendamentos e gerencie seu tempo.
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
             <Calendar
                mode="single"
                selected={new Date()}
                className="p-3"
                classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption_label: "text-lg font-medium",
                    head_cell: "text-muted-foreground rounded-md w-12 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "h-12 w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100 rounded-md",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                }}
            />
          </CardContent>
        </Card>
      </div>
      <div>
        <Card className="mt-20">
            <CardHeader>
                <CardTitle>Consultas de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {appointments.map(appt => (
                        <li key={appt.id} className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={appt.patientAvatar} />
                                <AvatarFallback>{appt.patientName.substring(0, 1)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <p className="font-semibold">{appt.time}</p>
                                <p className="text-sm text-muted-foreground">{appt.patientName}</p>
                                <p className="text-xs text-muted-foreground">{appt.type}</p>
                            </div>
                            <Button size="icon" variant="ghost">
                                <Video className="h-5 w-5 text-primary" />
                            </Button>
                        </li>
                    ))}
                    {appointments.length === 0 && (
                        <li className="text-center text-muted-foreground py-4">
                            Nenhuma consulta para hoje.
                        </li>
                    )}
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
