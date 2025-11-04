
import { getSession } from '@/lib/session';
import { getPatientById } from '@/lib/db-adapter';
import { redirect } from 'next/navigation';
import type { Patient } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Sparkles } from 'lucide-react';
import PatientProfileClient from './patient-profile-client';

async function getPatientData(userId: string): Promise<{ patient: Patient | null, error?: string }> {
    try {
        const patient = await getPatientById(userId);
        if (!patient) {
            return { patient: null, error: "Perfil do paciente não encontrado." };
        }
        return { patient };
    } catch (error) {
        console.error("Erro ao buscar dados do paciente no servidor:", error);
        return { patient: null, error: "Ocorreu um erro ao carregar os dados do perfil." };
    }
}

export default async function PatientProfilePage() {
    const session = await getSession();

    if (!session || session.role !== 'patient' || !session.userId) {
        redirect('/login');
    }

    const { userId } = session;
    const { patient, error } = await getPatientData(userId);

    if (error || !patient) {
        return (
            <div className="container mx-auto p-4">
                <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 text-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Perfil</AlertTitle>
                    <AlertDescription>{error || "Não foi possível encontrar os dados do paciente."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Effects - adaptar para funcionar em ambos os temas */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/20 dark:to-accent/20"></div>
            <div className="absolute inset-0 bg-grid-foreground/[0.01] dark:bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl animate-pulse delay-700"></div>
            
            <div className="relative z-10 container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-primary dark:text-cyan-400" />
                        <span className="text-sm text-primary dark:text-cyan-300 font-medium">Configurações de Perfil</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Meu Perfil
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Gerencie suas informações pessoais e foto de perfil.
                    </p>
                </div>
                
                <PatientProfileClient patient={patient} userId={userId} />
            </div>
        </div>
    );
}
