
"use client";

import { Bell, Droplet, Clock, Coffee, Bed, Dumbbell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GenerateWellnessPlanOutput } from "@/ai/flows/generate-wellness-plan";

type Reminder = GenerateWellnessPlanOutput['dailyReminders'][0];

interface WellnessRemindersProps {
    reminders: Reminder[];
}

const iconMap: { [key: string]: React.ReactNode } = {
    'Clock': <Clock className="h-5 w-5 text-blue-500" />,
    'Droplet': <Droplet className="h-5 w-5 text-cyan-500" />,
    'Coffee': <Coffee className="h-5 w-5 text-amber-600" />,
    'Bed': <Bed className="h-5 w-5 text-indigo-500" />,
    'Dumbbell': <Dumbbell className="h-5 w-5 text-green-500" />,
};


export default function WellnessReminders({ reminders }: WellnessRemindersProps) {

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
                                {iconMap[reminder.icon] || <Bell className="h-5 w-5" />}
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
