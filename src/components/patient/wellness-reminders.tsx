
import { Bell, Droplet, Clock, Coffee, Bed } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WellnessReminders() {
    const reminders = [
        {
            icon: <Clock className="h-5 w-5 text-blue-500" />,
            title: "Medicação das 8h",
            description: "Não se esqueça de tomar seu remédio para pressão."
        },
        {
            icon: <Droplet className="h-5 w-5 text-cyan-500" />,
            title: "Hidratação",
            description: "Beba um copo de água. Manter-se hidratado é essencial."
        },
        {
            icon: <Coffee className="h-5 w-5 text-amber-600" />,
            title: "Pausa para o Café",
            description: "Faça uma pequena pausa para relaxar e alongar."
        },
        {
            icon: <Bed className="h-5 w-5 text-indigo-500" />,
            title: "Prepare-se para Dormir",
            description: "Desligue as telas e comece a relaxar para uma boa noite de sono."
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-6 w-6 text-primary" />
                    Lembretes do Dia
                </CardTitle>
                <CardDescription>
                    Pequenos hábitos que fazem uma grande diferença.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {reminders.map(reminder => (
                        <li key={reminder.title} className="flex items-start gap-4">
                            <div className="mt-1">
                                {reminder.icon}
                            </div>
                            <div>
                                <p className="font-semibold">{reminder.title}</p>
                                <p className="text-sm text-muted-foreground">{reminder.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
