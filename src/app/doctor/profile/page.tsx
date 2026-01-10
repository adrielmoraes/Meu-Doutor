
import { getSession } from '@/lib/session';
import { getDoctorById } from '@/lib/db-adapter';
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
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Perfil</AlertTitle>
                    <AlertDescription>{error || "Não foi possível encontrar os dados do médico."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen relative font-sans text-slate-900">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-60"></div>

            <div className="relative z-10 container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800 font-bold">Perfil Profissional</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Meu Perfil e Controle
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
                        Gerencie suas informações profissionais, credenciais e sua presença na plataforma Dr.IA.
                    </p>
                </div>

                <ProfileClientManager doctor={doctor} userId={userId} />
            </div>
        </div>
    );
}
