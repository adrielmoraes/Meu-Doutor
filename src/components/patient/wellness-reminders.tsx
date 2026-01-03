
"use client";

import { Bell, Droplet, Clock, Coffee, Bed, Dumbbell, Apple, Heart, Sun, Moon, Activity, Utensils, Brain, Smile, Wind, Leaf } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GenerateWellnessPlanOutput } from "@/ai/flows/generate-wellness-plan";

type Reminder = GenerateWellnessPlanOutput['dailyReminders'][0];

interface WellnessRemindersProps {
    reminders: Reminder[];
}

const iconMap: { [key: string]: React.ReactNode } = {
    'Clock': <Clock className="h-5 w-5 text-blue-700 dark:text-blue-400" />,
    'Droplet': <Droplet className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />,
    'Coffee': <Coffee className="h-5 w-5 text-amber-700 dark:text-amber-400" />,
    'Bed': <Bed className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />,
    'Dumbbell': <Dumbbell className="h-5 w-5 text-green-700 dark:text-green-400" />,
    'Apple': <Apple className="h-5 w-5 text-red-700 dark:text-red-400" />,
    'Heart': <Heart className="h-5 w-5 text-pink-700 dark:text-pink-400" />,
    'Sun': <Sun className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />,
    'Moon': <Moon className="h-5 w-5 text-purple-700 dark:text-purple-400" />,
    'Activity': <Activity className="h-5 w-5 text-orange-700 dark:text-orange-400" />,
    'Utensils': <Utensils className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />,
    'Brain': <Brain className="h-5 w-5 text-violet-700 dark:text-violet-400" />,
    'Smile': <Smile className="h-5 w-5 text-rose-700 dark:text-rose-400" />,
    'Wind': <Wind className="h-5 w-5 text-sky-700 dark:text-sky-400" />,
    'Leaf': <Leaf className="h-5 w-5 text-lime-700 dark:text-lime-400" />,
};


export default function WellnessReminders({ reminders }: WellnessRemindersProps) {

    return (
        <Card className="border-blue-500/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                        <Bell className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                        Lembretes do Dia
                    </span>
                </CardTitle>
                <CardDescription className="text-black dark:text-muted-foreground">
                    Pequenos hábitos que fazem a diferença.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {(reminders || []).map(reminder => (
                        <li key={reminder.title} className="flex items-start gap-4">
                            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                                {iconMap[reminder.icon] || <Bell className="h-5 w-5" />}
                            </div>
                            <div>
                                <p className="font-semibold text-foreground dark:text-foreground">{reminder.title}</p>
                                <p className="text-sm text-black dark:text-muted-foreground">{reminder.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
