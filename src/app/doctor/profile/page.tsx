
import { getSession } from '@/lib/session';
import { getDoctorById } from '@/lib/firestore-admin-adapter';
import { redirect } from 'next/navigation';
import type { Doctor } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

// Importar o novo Client Component
import ProfileClientManager from './profile-client-manager';

// Função de busca de dados no servidor
async function getDoctorData(userId: string): Promise<{ doctor: Doctor | null, error?: string }> {
    try {
        // Usando o admin-adapter pois estamos no servidor
        const doctor = await getDoctorById(userId);
        if (!doctor) {
            return { doctor: null, error: "Perfil do médico não encontrado." };
        }
        return { doctor };
    } catch (error) {
        console.error("Erro ao buscar dados do médico no servidor:", error);
        return { doctor: null, error: "Ocorreu um erro ao carregar os dados do perfil." };
    }
}

// A página principal agora é um Server Component
export default async function ProfilePage() {
    const session = await getSession();

    if (!session || session.role !== 'doctor' || !session.userId) {
        redirect('/login');
    }

    const { userId } = session;
    const { doctor, error } = await getDoctorData(userId);

    if (error || !doctor) {
        return (
            <div className="container mx-auto p-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Perfil</AlertTitle>
                    <AlertDescription>{error || "Não foi possível encontrar os dados do médico."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Meu Perfil e Progresso</h1>
                <p className="text-muted-foreground">Gerencie suas informações profissionais e foto de perfil.</p>
            </div>
            
            {/* 
              Renderiza o Client Component, passando os dados do servidor como props.
              A lógica de estado e interação fica isolada neste componente.
            */}
            <ProfileClientManager doctor={doctor} userId={userId} />

        </div>
    );
}
