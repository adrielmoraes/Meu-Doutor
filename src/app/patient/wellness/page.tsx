
import { getPatientById } from "@/lib/firestore-adapter";
import { notFound } from "next/navigation";
import { generateWellnessPlan } from "@/ai/flows/generate-wellness-plan";
import WellnessReminders from "@/components/patient/wellness-reminders";
import { FileText, Dumbbell, BrainCircuit, HeartPulse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

export default async function WellnessPlanPage() {
    const patient = await getPatientById(MOCK_PATIENT_ID);
    if (!patient) {
        notFound();
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
                            <CardContent>
                                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                                    {section.content}
                                </p>
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
