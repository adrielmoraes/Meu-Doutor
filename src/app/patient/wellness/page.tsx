
import { getPatientById } from "@/lib/firestore-admin-adapter"; // Importar getPatientById do admin-adapter
import { notFound, redirect } from "next/navigation";
import { generateWellnessPlan } from "@/ai/flows/generate-wellness-plan";
import WellnessReminders from "@/components/patient/wellness-reminders";
import { FileText, Dumbbell, BrainCircuit, HeartPulse, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AudioPlayback from "@/components/patient/audio-playback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import type { Patient } from "@/types";
import { getSession } from "@/lib/session";


async function getWellnessPageData(patientId: string): Promise<{ patient: Patient | null, error?: string, fixUrl?: string }> {
    try {
        const patient = await getPatientById(patientId); // Usar a função getPatientById do admin
        if (!patient) {
            notFound();
        }
        return { patient };
    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = e.code?.toLowerCase() || '';
        
        if (errorMessage.includes('client is offline') || errorMessage.includes('5 not_found') || errorCode.includes('not-found')) {
            const firestoreApiUrl = `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;
            return { 
                patient: null,
                error: "Não foi possível conectar ao banco de dados. A API do Cloud Firestore pode estar desativada ou o cliente está offline.",
                fixUrl: firestoreApiUrl 
            };
        }
        console.error("Unexpected error fetching patient for wellness page:", e);
        return { patient: null, error: "Ocorreu um erro inesperado ao carregar os dados para o plano de bem-estar." };
    }
}


export default async function WellnessPlanPage() {
    const session = await getSession();
    if (!session || session.role !== 'patient') {
        redirect('/login');
    }

    const { patient, error, fixUrl } = await getWellnessPageData(session.userId);

     if (error || !patient) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Página</AlertTitle>
                    <AlertDescription>
                        {error || "Não foi possível carregar os dados do paciente."}
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

    // In a real app, you might only generate this once, or allow regeneration.
    // For the prototype, we generate it on every visit to the page.
    const wellnessPlan = await generateWellnessPlan({
        patientHistory: patient.conversationHistory || "Nenhum histórico de conversa recente.",
        examResults: patient.examResults || "Nenhum exame recente carregado.",
    });

    const planSections = [
        {
            title: "Plano Alimentar",
            icon: <FileText className="h-6 w-6" />,
            content: wellnessPlan.dietaryPlan,
        },
        {
            title: "Plano de Exercícios",
            icon: <Dumbbell className="h-6 w-6" />,
            content: wellnessPlan.exercisePlan,
        },
        {
            title: "Bem-Estar Mental",
            icon: <BrainCircuit className="h-6 w-6" />,
            content: wellnessPlan.mentalWellnessPlan,
        },
    ];

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                   <HeartPulse className="h-8 w-8 text-primary" /> Meu Plano de Bem-Estar Personalizado
                </h1>
                <p className="text-muted-foreground mt-2">
                    Gerado pela IA para ajudar você a alcançar seus objetivos de saúde.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                 <div className="md:col-span-2 space-y-6">
                    {planSections.map(section => (
                        <Card key={section.title}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    {section.icon}
                                    {section.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                                    {section.content}
                                </p>
                                <AudioPlayback textToSpeak={section.content} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="space-y-6">
                   <WellnessReminders reminders={wellnessPlan.dailyReminders} />
                </div>
            </div>
        </div>
    );
}
