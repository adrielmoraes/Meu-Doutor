
import { getSession } from '@/lib/session';
import { getDoctorById } from '@/lib/firestore-admin-adapter';
import { redirect } from 'next/navigation';
import type { Doctor } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Sparkles } from 'lucide-react';
import ProfileClientManager from './profile-client-manager';

async function getDoctorData(userId: string): Promise<{ doctor: Doctor | null, error?: string }> {
    try {
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
                <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 text-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Perfil</AlertTitle>
                    <AlertDescription>{error || "Não foi possível encontrar os dados do médico."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
            
            <div className="relative z-10 container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-purple-300 font-medium">Perfil Profissional</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                        Meu Perfil e Progresso
                    </h1>
                    <p className="text-lg text-blue-200/70">
                        Gerencie suas informações profissionais e foto de perfil.
                    </p>
                </div>
                
                <ProfileClientManager doctor={doctor} userId={userId} />
            </div>
        </div>
    );
}
