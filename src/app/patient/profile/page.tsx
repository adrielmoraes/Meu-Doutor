
import { getSession } from '@/lib/session';
import { getPatientById } from '@/lib/firestore-admin-adapter';
import { redirect } from 'next/navigation';
import type { Patient } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
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
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Perfil</AlertTitle>
                    <AlertDescription>{error || "Não foi possível encontrar os dados do paciente."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
                <p className="text-muted-foreground">Gerencie suas informações pessoais e foto de perfil.</p>
            </div>
            
            <PatientProfileClient patient={patient} userId={userId} />
        </div>
    );
}
