"use client";

import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    Bell, Droplet, Clock, Coffee, Bed, Dumbbell, Apple, Heart,
    Sun, Moon, Activity, Utensils, Brain, Smile, Wind, Leaf,
    Target, TrendingUp, AlertTriangle, CheckCircle2
} from "lucide-react";
import type { GenerateWellnessPlanOutput } from "@/ai/flows/generate-wellness-plan";

type Reminder = GenerateWellnessPlanOutput['dailyReminders'][0];

interface HealthGoal {
    title: string;
    description: string;
    category: string;
    progress: number;
    targetDate: string;
}

interface WellnessReminderToastsProps {
    reminders: Reminder[];
    healthGoals?: HealthGoal[];
}

const iconMap: { [key: string]: React.ReactNode } = {
    'Clock': <Clock className="h-5 w-5 text-blue-500" />,
    'Droplet': <Droplet className="h-5 w-5 text-cyan-500" />,
    'Coffee': <Coffee className="h-5 w-5 text-amber-500" />,
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

const goalCategoryIcons: { [key: string]: React.ReactNode } = {
    'exercise': <Dumbbell className="h-5 w-5 text-green-500" />,
    'nutrition': <Apple className="h-5 w-5 text-orange-500" />,
    'mindfulness': <Brain className="h-5 w-5 text-violet-500" />,
    'medical': <Heart className="h-5 w-5 text-red-500" />,
    'lifestyle': <Sun className="h-5 w-5 text-yellow-500" />,
};

// Som curto e suave de notificação embutido em Base64
const PLIM_SOUND = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JjYuGfXFkWVljcH2IjouHfnJlWlpicH6KjoyIf3JlWlpicH6KjoyIf3JlWltjcX+LjouHfnJlW1tjcn+LjouGfXFkW1xkc4CLjYuFfHBjW1xkc4CMjouFfHBjXF1ldIGMjouEe29iXF1ldIGMj4yFe29hXF5meIKNj4yEem5hXV5meIKOkIyDem1gXV9ne4OPkIuCeGxfXmBofISQkYuBd2teXmBofIWRkouAdmpeX2FpfYWSk4uAdWleX2FpfYaTk4t/dGhdX2JqfoeUlIt+c2ddYGNrfoiVlIt9cmZdYGNrfoiWlYt8cWVdYWRsgImXlot7cGRdYWRsgIqYl4t6b2NdYmVtgYuZl4p5bmJeY2ZugoqZmIt4bWFfZGdvg4yamIp3bGBfZGdvg4yam4l1a19gZmhxhI2bnIh0al5gZmlyhY6cnYdyaF1hZ2pzhpCdnYZxZ1xhaGxziJCen4ZwZltiaW1riJGenoBuZFtia25siZOfnoBsY1pjam9uipSgoH9rYlljbHBvjJWioX5pYFhkbXJwjZajo35nXldlb3RxjpmkpH1lXVdmcHZyjpulpXxjW1ZncnhzkJymp3tiWlVodHl0kJ6oqHpgWFVpdnt1kqCpqXlgVlRqeH13k6GrqnheVFNrenx4lKOsrHdcUlJsfH96laWtrHZaUFBuf4F7l6evrnVYTk9vgYN9mKixr3RWTU5xg4V+mquzsnNUTE1zhId/m62zsXFSTExzhop/nK+1snBPSkp1iIyBoLC2s29NR0h3io6CoLK4tG5LRUd4jZCAo7S5tm1JREJ5jpOBpLa7t2tIQkB7kJWCpri9uWpGQD58kpiDp7q/vGlEPjx/lJuEqbzBvmdCPDqAlp6FqrzDwGZAPDmClqGGq77Fwt8+OjmDl6OIrMDHxWQ9OTaFmqaJrcLJx2M7NzWGm6mKr8TLyWE6NTSHnayLsMXNy2A5MzOInq6NssXOzmA3MDGJIK+Ns8fP0F42Li+KoLKPs8nR0l01LS6Lo7SRtcrT1Fw0Ky2MpbaRt8zV1Vs0KSyNp7iSuc3X11szJyuPqbuTu87Z2FoyJimQq72Uvc/b2lkxJSiRrL+VvtHc3FgwJCaSrMCWwNLd3lcvIySTrsGXwdPf4FYuISKUrsSYw9Xh4lUtICGWr8aZxNfj5FQtHx+XscibxNhk"

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24h em ms
const GOAL_CHECK_KEY = "mediai_last_goal_check";

function getGoalMotivationalMessage(goal: HealthGoal): string {
    if (goal.progress >= 80) {
        return `🎉 Você está quase lá! Meta "${goal.title}" está em ${goal.progress}%. Continue assim!`;
    } else if (goal.progress >= 50) {
        return `💪 Bom progresso! Meta "${goal.title}" já está em ${goal.progress}%. Mantenha o ritmo!`;
    } else if (goal.progress >= 20) {
        return `🌱 Cada passo conta! Meta "${goal.title}" está em ${goal.progress}%. Você consegue!`;
    } else {
        return `🚀 Hora de começar! Meta "${goal.title}" está em ${goal.progress}%. Que tal dar o primeiro passo hoje?`;
    }
}

function getGoalIcon(goal: HealthGoal): React.ReactNode {
    if (goal.progress >= 80) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (goal.progress >= 50) return <TrendingUp className="h-5 w-5 text-blue-500" />;
    if (goal.progress >= 20) return goalCategoryIcons[goal.category] || <Target className="h-5 w-5 text-amber-500" />;
    return <AlertTriangle className="h-5 w-5 text-orange-500" />;
}

function shouldCheckGoals(): boolean {
    try {
        const lastCheck = localStorage.getItem(GOAL_CHECK_KEY);
        if (!lastCheck) return true;
        const elapsed = Date.now() - parseInt(lastCheck, 10);
        return elapsed >= TWENTY_FOUR_HOURS;
    } catch {
        return true; // Se localStorage não estiver disponível, mostra sempre
    }
}

function markGoalsChecked(): void {
    try {
        localStorage.setItem(GOAL_CHECK_KEY, Date.now().toString());
    } catch {
        // silencioso
    }
}

export default function WellnessReminderToasts({ reminders, healthGoals }: WellnessReminderToastsProps) {
    const { toast } = useToast();
    const currentReminderIndexRef = useRef(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const playSound = useCallback(() => {
        try {
            const audio = new Audio(PLIM_SOUND);
            audio.volume = 0.35;
            audio.play().catch(() => { /* autoplay bloqueado */ });
        } catch { /* silencioso */ }
    }, []);

    // ═══════════════════════════════════════════════════
    // 1) VERIFICAÇÃO DE METAS A CADA 24H
    // ═══════════════════════════════════════════════════
    useEffect(() => {
        if (!healthGoals || healthGoals.length === 0) return;
        if (!shouldCheckGoals()) return;

        // Marca como verificado imediatamente para não repetir na mesma sessão
        markGoalsChecked();

        // Dispara as notificações de metas em sequência, com 3 segundos de intervalo entre cada
        healthGoals.forEach((goal, index) => {
            setTimeout(() => {
                playSound();
                toast({
                    title: `🎯 Meta: ${goal.title}`,
                    description: getGoalMotivationalMessage(goal),
                    action: getGoalIcon(goal),
                    duration: 30000,
                });
            }, 5000 + (index * 3600000)); // 5s de delay inicial + 1h entre cada meta
        });

    }, [healthGoals, toast, playSound]);

    // ═══════════════════════════════════════════════════
    // 2) LEMBRETES DIÁRIOS (a cada 1h)
    // ═══════════════════════════════════════════════════
    useEffect(() => {
        if (!reminders || reminders.length === 0) return;

        const triggerReminder = () => {
            const currentReminder = reminders[currentReminderIndexRef.current];
            playSound();

            toast({
                title: currentReminder.title,
                description: currentReminder.description,
                action: iconMap[currentReminder.icon] || <Bell className="h-5 w-5 text-indigo-500" />,
                duration: 30000,
            });

            currentReminderIndexRef.current = (currentReminderIndexRef.current + 1) % reminders.length;
        };

        // Primeiro lembrete diário após 5 segundos, depois a cada 1 hora
        const firstTimeout = setTimeout(() => {
            triggerReminder();
            intervalRef.current = setInterval(triggerReminder, 3600000); // 1 hora
        }, 5000);

        return () => {
            clearTimeout(firstTimeout);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [reminders, toast, playSound]);

    return null;
}
