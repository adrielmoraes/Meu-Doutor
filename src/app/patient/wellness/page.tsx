import { getPatientById } from "@/lib/db-adapter";
import { notFound, redirect } from "next/navigation";
import WellnessReminders from "@/components/patient/wellness-reminders";
import {
    FileText, Dumbbell, BrainCircuit, HeartPulse, AlertTriangle, Sparkles,
    Calendar, ChefHat, Apple, Target, Zap, Brain, Activity, Heart, Info, ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import WellnessAudioPlayback from "@/components/patient/wellness-audio-playback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Patient } from "@/types";
import { getSession } from "@/lib/session";
import RegenerateWellnessPlanButton from "@/components/patient/regenerate-wellness-plan-button";
import WeeklyTasksSection from "@/components/patient/weekly-tasks-section";
import WellnessMarkdownContent from "@/components/patient/wellness-markdown-content";


// --- INTERNAL COMPONENTS (To avoid new files) ---

function CoachMessage({ message }: { message: string }) {
    return (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border-l-4 border-indigo-500 dark:border-indigo-400 p-4 rounded-r-lg shadow-sm my-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center border border-indigo-200 dark:border-indigo-700">
                    <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                </div>
                <span className="font-bold text-indigo-700 dark:text-indigo-300">Insight do Dr. Health</span>
            </div>
            <p className="text-indigo-900 dark:text-indigo-100 italic text-lg leading-relaxed">&ldquo;{message}&rdquo;</p>
        </div>
    );
}

function PreventiveAlertsList({ alerts }: { alerts: any[] }) {
    if (!alerts || alerts.length === 0) return null;

    const styles: any = {
        high: "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800",
        medium: "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        low: "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    };

    return (
        <Card className="border-l-4 border-l-amber-400 dark:border-l-amber-500 overflow-hidden bg-white dark:bg-gray-900 shadow-sm mb-6">
            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 border-b border-amber-100 dark:border-amber-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Alertas Preventivos</h3>
            </div>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {alerts.map((item, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex justify-between items-start gap-3">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.alert}</p>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${styles[item.severity] || styles.low}`}>
                                    {item.severity}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">Categoria: {item.category}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function HealthGoalsList({ goals }: { goals: any[] }) {
    if (!goals || goals.length === 0) return null;
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {goals.map((goal, index) => (
                <div key={index} className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">{goal.category}</span>
                        {goal.targetDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full">
                                <Calendar className="w-3 h-3" /><span>{goal.targetDate}</span>
                            </div>
                        )}
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{goal.title}</h4>
                    <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1.5 font-medium"><span className="text-gray-500 dark:text-gray-400">Progresso</span><span className="text-primary">{goal.progress}%</span></div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden"><div className="bg-primary h-full rounded-full" style={{ width: `${goal.progress}%` }}></div></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- MAIN PAGE COMPONENT ---

async function getWellnessPageData(patientId: string): Promise<{ patient: Patient | null, error?: string }> {
    try {
        const patient = await getPatientById(patientId);
        if (!patient) {
            notFound();
        }
        return { patient };
    } catch (e: any) {
        console.error("Unexpected error fetching patient for wellness page:", e);
        return { patient: null, error: "Ocorreu um erro inesperado ao carregar os dados para o plano de bem-estar." };
    }
}


export default async function WellnessPlanPage() {
    const session = await getSession();
    if (!session || session.role !== 'patient') {
        redirect('/login');
    }

    const { patient, error } = await getWellnessPageData(session.userId);

    if (error || !patient) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Página</AlertTitle>
                    <AlertDescription>
                        {error || "Não foi possível carregar os dados do paciente."}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const wellnessPlan = patient.wellnessPlan;
    const hasWellnessPlan = !!wellnessPlan;

    // If no wellness plan exists, show a message to upload exams first
    if (!hasWellnessPlan) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                        <HeartPulse className="h-8 w-8 text-primary/60 dark:text-primary" />
                        Meu Plano de Bem-Estar Personalizado
                    </h1>
                    <p className="text-black dark:text-muted-foreground mt-2">
                        Gerado pela IA Nutricionista para ajudar você a alcançar seus objetivos de saúde.
                    </p>
                </div>

                <Card className="bg-card/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-6 w-6 text-primary" />
                            Plano de Bem-Estar em Preparo
                        </CardTitle>
                        <CardDescription className="text-black dark:text-muted-foreground">
                            Seu plano personalizado será criado automaticamente
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-black dark:text-foreground leading-relaxed">
                            Seu plano de bem-estar personalizado será gerado automaticamente pela nossa <span className="text-primary font-semibold">IA Nutricionista</span> assim que você fizer o upload de seus primeiros exames.
                        </p>
                        <p className="text-black dark:text-foreground leading-relaxed">
                            A IA analisará todos os seus resultados de exames e criará um plano completo incluindo:
                        </p>
                        <ul className="space-y-2 ml-6">
                            <li className="text-black dark:text-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span><strong className="text-primary">Plano Alimentar</strong> personalizado com base nos seus exames</span>
                            </li>
                            <li className="text-black dark:text-foreground flex items-start gap-2">
                                <span className="text-accent mt-1">•</span>
                                <span><strong className="text-accent">Plano de Exercícios</strong> adequado à sua condição</span>
                            </li>
                            <li className="text-black dark:text-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span><strong className="text-primary">Bem-Estar Mental</strong> com técnicas de relaxamento</span>
                            </li>
                            <li className="text-black dark:text-foreground flex items-start gap-2">
                                <span className="text-accent mt-1">•</span>
                                <span><strong className="text-accent">Lembretes Diários</strong> para manter sua saúde em dia</span>
                            </li>
                        </ul>
                        <div className="mt-6 pt-6 border-t border-border">
                            <RegenerateWellnessPlanButton patientId={patient.id} lastUpdated={undefined} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const lastUpdated = wellnessPlan.lastUpdated
        ? new Date(wellnessPlan.lastUpdated).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Data não disponível';

    const planSections: Array<{
        title: string;
        icon: React.ReactNode;
        content: string;
        section: 'dietary' | 'exercise' | 'mental';
        audioUri?: string;
        border: string;
        iconBg: string;
        titleColor: string;
    }> = [
            {
                title: "Análise Preliminar",
                icon: <FileText className="h-6 w-6 text-white" />,
                content: wellnessPlan.preliminaryAnalysis,
                section: 'dietary',
                audioUri: wellnessPlan.preliminaryAnalysisAudioUri,
                border: "border-blue-500/30",
                iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
                titleColor: "bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent"
            },
            {
                title: "Plano de Exercícios",
                icon: <Dumbbell className="h-6 w-6 text-white" />,
                content: wellnessPlan.exercisePlan,
                section: 'exercise',
                audioUri: wellnessPlan.exercisePlanAudioUri,
                border: "border-orange-500/30",
                iconBg: "bg-gradient-to-br from-orange-500 to-red-600",
                titleColor: "bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent"
            },
            {
                title: "Bem-Estar Mental",
                icon: <BrainCircuit className="h-6 w-6 text-white" />,
                content: wellnessPlan.mentalWellnessPlan,
                section: 'mental',
                audioUri: wellnessPlan.mentalWellnessPlanAudioUri,
                border: "border-purple-500/30",
                iconBg: "bg-gradient-to-br from-purple-500 to-pink-600",
                titleColor: "bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent"
            },
        ];

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                            <HeartPulse className="h-8 w-8 text-primary/60 dark:text-primary" />
                            Meu Plano de Bem-Estar Personalizado
                        </h1>
                        <p className="text-black dark:text-muted-foreground mt-2">
                            Gerado pela IA Nutricionista com base nos seus exames
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-sm text-black dark:text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Última atualização: {lastUpdated}</span>
                        </div>
                    </div>
                    <RegenerateWellnessPlanButton patientId={patient.id} lastUpdated={wellnessPlan.lastUpdated} />
                </div>
            </div>

            {/* NEW: Coach Message */}
            {wellnessPlan.coachComment && <CoachMessage message={wellnessPlan.coachComment} />}

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* NEW: Health Goals */}
                    {wellnessPlan.healthGoals && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" /> Metas Prioritárias
                            </h2>
                            <HealthGoalsList goals={wellnessPlan.healthGoals} />
                        </div>
                    )}

                    {/* Existing Plan Sections */}
                    {planSections.map(section => (
                        <div key={section.title} className={`rounded - lg border ${section.border} bg - card / 80 p - 6`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p - 2 rounded - lg ${section.iconBg} `}>{section.icon}</div>
                                <h3 className={`font - semibold text - xl ${section.titleColor} `}>{section.title}</h3>
                            </div>
                            <WellnessMarkdownContent content={section.content} variant={section.section} />
                            <WellnessAudioPlayback textToSpeak={section.content} section={section.section} preGeneratedAudioUri={section.audioUri} patientId={patient.id} />
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* NEW: Preventive Alerts in Sidebar */}
                    {wellnessPlan.preventiveAlerts && <PreventiveAlertsList alerts={wellnessPlan.preventiveAlerts} />}

                    <WellnessReminders reminders={wellnessPlan.dailyReminders} />
                </div>
            </div>

            {wellnessPlan.weeklyMealPlan && wellnessPlan.weeklyMealPlan.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
                        <ChefHat className="h-7 w-7 text-primary/60 dark:text-primary" />
                        Plano Semanal de Refeições
                    </h2>
                    <div className="space-y-6">
                        {wellnessPlan.weeklyMealPlan.map((dayPlan) => (
                            <Card key={dayPlan.day} className="bg-card/80 backdrop-blur-xl border-2 border-primary/20 overflow-hidden">
                                <details className="group">
                                    <summary className="cursor-pointer list-none outline-none">
                                        <CardHeader className="flex flex-row items-center justify-between p-6 group-hover:bg-primary/5 transition-colors">
                                            <CardTitle className="text-xl text-primary flex items-center gap-2">
                                                {dayPlan.day}
                                                <span className="text-xs font-normal text-muted-foreground ml-2 px-2 py-0.5 rounded-full border bg-background/50 hidden group-open:inline-block">
                                                    Expandido
                                                </span>
                                            </CardTitle>
                                            <ChevronDown className="h-5 w-5 text-primary/60 transition-transform duration-300 group-open:rotate-180" />
                                        </CardHeader>
                                    </summary>

                                    <CardContent className="space-y-6 pt-0 px-6 pb-6 border-t border-primary/10 animate-in slide-in-from-top-2 duration-200">
                                        <div className="pt-6">
                                            {/* Café da Manhã */}
                                            <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 rounded-lg mb-6">
                                                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                                                    ☀️ Café da Manhã
                                                </p>
                                                <p className="text-sm text-foreground mb-3">{dayPlan.breakfast}</p>
                                                {dayPlan.breakfastRecipe && (
                                                    <div className="mt-3 p-3 bg-card/50 rounded border border-amber-500/20">
                                                        <h4 className="font-semibold text-sm mb-2 text-amber-700 dark:text-amber-300">
                                                            📖 {dayPlan.breakfastRecipe.title}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground mb-2">⏱️ {dayPlan.breakfastRecipe.prepTime}</p>
                                                        <div className="mb-2">
                                                            <p className="text-xs font-semibold mb-1">Ingredientes:</p>
                                                            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                                                                {dayPlan.breakfastRecipe.ingredients.map((ing, idx) => (
                                                                    <li key={idx}>• {ing}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold mb-1">Modo de Preparo:</p>
                                                            <p className="text-xs text-muted-foreground whitespace-pre-line">{dayPlan.breakfastRecipe.instructions}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Almoço */}
                                            <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-lg mb-6">
                                                <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                                                    🍽️ Almoço
                                                </p>
                                                <p className="text-sm text-foreground mb-3">{dayPlan.lunch}</p>
                                                {dayPlan.lunchRecipe && (
                                                    <div className="mt-3 p-3 bg-card/50 rounded border border-green-500/20">
                                                        <h4 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-300">
                                                            📖 {dayPlan.lunchRecipe.title}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground mb-2">⏱️ {dayPlan.lunchRecipe.prepTime}</p>
                                                        <div className="mb-2">
                                                            <p className="text-xs font-semibold mb-1">Ingredientes:</p>
                                                            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                                                                {dayPlan.lunchRecipe.ingredients.map((ing, idx) => (
                                                                    <li key={idx}>• {ing}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold mb-1">Modo de Preparo:</p>
                                                            <p className="text-xs text-muted-foreground whitespace-pre-line">{dayPlan.lunchRecipe.instructions}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Jantar */}
                                            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/30 rounded-lg mb-6">
                                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                    🌙 Jantar
                                                </p>
                                                <p className="text-sm text-foreground mb-3">{dayPlan.dinner}</p>
                                                {dayPlan.dinnerRecipe && (
                                                    <div className="mt-3 p-3 bg-card/50 rounded border border-blue-500/20">
                                                        <h4 className="font-semibold text-sm mb-2 text-blue-700 dark:text-blue-300">
                                                            📖 {dayPlan.dinnerRecipe.title}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground mb-2">⏱️ {dayPlan.dinnerRecipe.prepTime}</p>
                                                        <div className="mb-2">
                                                            <p className="text-xs font-semibold mb-1">Ingredientes:</p>
                                                            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                                                                {dayPlan.dinnerRecipe.ingredients.map((ing, idx) => (
                                                                    <li key={idx}>• {ing}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold mb-1">Modo de Preparo:</p>
                                                            <p className="text-xs text-muted-foreground whitespace-pre-line">{dayPlan.dinnerRecipe.instructions}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Lanches */}
                                            {dayPlan.snacks && (
                                                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-lg">
                                                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                                                        🍎 Lanches
                                                    </p>
                                                    <p className="text-sm text-foreground">{dayPlan.snacks}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </details>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Tarefas da Semana
                </h2>
                <WeeklyTasksSection
                    patientId={patient.id}
                    tasks={wellnessPlan.weeklyTasks || []}
                />
            </div>
        </div>
    );
}
