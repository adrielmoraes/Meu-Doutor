
"use client";

import { Bell, Droplet, Clock, Coffee, Bed, Dumbbell, Apple, Heart, Sun, Moon, Activity, Utensils, Brain, Smile, Wind, Leaf } from "lucide-react";
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
    'Apple': <Apple className="h-5 w-5 text-red-500" />,
    'Heart': <Heart className="h-5 w-5 text-pink-500" />,
    'Sun': <Sun className="h-5 w-5 text-yellow-500" />,
    'Moon': <Moon className="h-5 w-5 text-purple-500" />,
    'Activity': <Activity className="h-5 w-5 text-orange-500" />,
    'Utensils': <Utensils className="h-5 w-5 text-emerald-500" />,
    'Brain': <Brain className="h-5 w-5 text-violet-500" />,
    'Smile': <Smile className="h-5 w-5 text-rose-500" />,
    'Wind': <Wind className="h-5 w-5 text-sky-500" />,
    'Leaf': <Leaf className="h-5 w-5 text-lime-500" />,
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
                    Pequenos hábitos que fazem a diferença.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {reminders.map(reminder => (
                        <li key={reminder.title} className="flex items-start gap-4">
                            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-muted">
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
