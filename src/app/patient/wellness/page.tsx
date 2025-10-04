
import { getPatientById } from "@/lib/db-adapter";
import { notFound, redirect } from "next/navigation";
import WellnessReminders from "@/components/patient/wellness-reminders";
import { FileText, Dumbbell, BrainCircuit, HeartPulse, AlertTriangle, Sparkles, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AudioPlayback from "@/components/patient/audio-playback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Patient } from "@/types";
import { getSession } from "@/lib/session";
import RegenerateWellnessPlanButton from "@/components/patient/regenerate-wellness-plan-button";
import WeeklyTasksSection from "@/components/patient/weekly-tasks-section";


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
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                        <HeartPulse className="h-8 w-8 text-cyan-400" /> 
                        Meu Plano de Bem-Estar Personalizado
                    </h1>
                    <p className="text-blue-200/70 mt-2">
                        Gerado pela IA Nutricionista para ajudar você a alcançar seus objetivos de saúde.
                    </p>
                </div>

                <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-cyan-300">
                            <Sparkles className="h-6 w-6" />
                            Plano de Bem-Estar em Preparo
                        </CardTitle>
                        <CardDescription className="text-blue-200/60">
                            Seu plano personalizado será criado automaticamente
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-200 leading-relaxed">
                            Seu plano de bem-estar personalizado será gerado automaticamente pela nossa <span className="text-cyan-400 font-semibold">IA Nutricionista</span> assim que você fizer o upload de seus primeiros exames.
                        </p>
                        <p className="text-slate-300 leading-relaxed">
                            A IA analisará todos os seus resultados de exames e criará um plano completo incluindo:
                        </p>
                        <ul className="space-y-2 ml-6">
                            <li className="text-slate-300 flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">•</span>
                                <span><strong className="text-cyan-300">Plano Alimentar</strong> personalizado com base nos seus exames</span>
                            </li>
                            <li className="text-slate-300 flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong className="text-blue-300">Plano de Exercícios</strong> adequado à sua condição</span>
                            </li>
                            <li className="text-slate-300 flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span><strong className="text-purple-300">Bem-Estar Mental</strong> com técnicas de relaxamento</span>
                            </li>
                            <li className="text-slate-300 flex items-start gap-2">
                                <span className="text-amber-400 mt-1">•</span>
                                <span><strong className="text-amber-300">Lembretes Diários</strong> para manter sua saúde em dia</span>
                            </li>
                        </ul>
                        <div className="mt-6 pt-6 border-t border-cyan-500/20">
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

    const planSections = [
        {
            title: "Plano Alimentar",
            icon: <FileText className="h-6 w-6 text-cyan-400" />,
            content: wellnessPlan.dietaryPlan,
            gradient: "from-cyan-500/10 to-blue-500/10",
            border: "border-cyan-500/30",
            iconBg: "bg-cyan-500/20",
        },
        {
            title: "Plano de Exercícios",
            icon: <Dumbbell className="h-6 w-6 text-blue-400" />,
            content: wellnessPlan.exercisePlan,
            gradient: "from-blue-500/10 to-purple-500/10",
            border: "border-blue-500/30",
            iconBg: "bg-blue-500/20",
        },
        {
            title: "Bem-Estar Mental",
            icon: <BrainCircuit className="h-6 w-6 text-purple-400" />,
            content: wellnessPlan.mentalWellnessPlan,
            gradient: "from-purple-500/10 to-pink-500/10",
            border: "border-purple-500/30",
            iconBg: "bg-purple-500/20",
        },
    ];

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                            <HeartPulse className="h-8 w-8 text-cyan-400" /> 
                            Meu Plano de Bem-Estar Personalizado
                        </h1>
                        <p className="text-blue-200/70 mt-2">
                            Gerado pela IA Nutricionista com base nos seus exames
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-sm text-slate-400">
                            <Calendar className="h-4 w-4" />
                            <span>Última atualização: {lastUpdated}</span>
                        </div>
                    </div>
                    <RegenerateWellnessPlanButton patientId={patient.id} lastUpdated={wellnessPlan.lastUpdated} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                 <div className="md:col-span-2 space-y-6">
                    {planSections.map(section => (
                        <div 
                            key={section.title}
                            className={`rounded-lg border ${section.border} bg-gradient-to-br ${section.gradient} p-6 backdrop-blur-sm`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${section.iconBg}`}>
                                    {section.icon}
                                </div>
                                <h3 className="font-semibold text-xl text-slate-100">{section.title}</h3>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed text-slate-200 mb-4">
                                {section.content}
                            </p>
                            <AudioPlayback textToSpeak={section.content} />
                        </div>
                    ))}
                </div>
                <div className="space-y-6">
                   <WellnessReminders reminders={wellnessPlan.dailyReminders} />
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
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
