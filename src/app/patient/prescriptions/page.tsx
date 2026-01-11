import { db } from '@/server/storage';
import { prescriptions, doctors } from '@/shared/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import PrescriptionsList from "@/components/patient/prescriptions-list";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPatientById } from "@/lib/db-adapter";
import { PatientHeader } from "@/components/patient/patient-header";

async function getPrescriptionData(patientId: string) {
    const data = await db
        .select({
            id: prescriptions.id,
            type: prescriptions.type,
            title: prescriptions.title,
            status: prescriptions.status,
            createdAt: prescriptions.createdAt,
            signedPdfUrl: prescriptions.signedPdfUrl,
            aiExplanation: prescriptions.aiExplanation,
            aiExplanationAudioUri: prescriptions.aiExplanationAudioUri,
            doctorName: doctors.name,
            specialty: doctors.specialty,
        })
        .from(prescriptions)
        .innerJoin(doctors, eq(prescriptions.doctorId, doctors.id))
        .where(eq(prescriptions.patientId, patientId))
        .orderBy(desc(prescriptions.createdAt));

    return data;
}

export default async function PatientPrescriptionsPage() {
    const session = await getSession();
    if (!session || session.role !== 'patient') {
        redirect('/login');
    }

    const [data, patient] = await Promise.all([
        getPrescriptionData(session.userId),
        getPatientById(session.userId)
    ]);

    if (!patient) {
        redirect('/login');
    }

    return (
        <div className="bg-gradient-to-br from-[#fce7f5] via-[#f9d5ed] to-[#fce7f5] dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 min-h-screen relative overflow-hidden transition-colors duration-500">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#f774c0]/15 via-transparent to-transparent dark:from-cyan-900/20"></div>
            <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
            <div className="absolute top-10 right-10 w-72 h-72 bg-[#f774c0]/15 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#e85bb5]/15 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

            <PatientHeader patient={patient} />

            <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
                {/* Back Button */}
                <div className="mb-8">
                    <Link href="/patient/dashboard">
                        <Button variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary gap-2 hover:bg-white/40 dark:hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-primary/20 backdrop-blur-sm">
                            <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
                        </Button>
                    </Link>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <div className="flex flex-col gap-2 mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm w-fit">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs text-primary font-bold uppercase tracking-wider">
                                Histórico Médico
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Prescrições e Documentos</h1>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                            Acesse suas receitas, atestados e laudos assinados digitalmente pelos seus médicos.
                        </p>
                    </div>

                    <PrescriptionsList prescriptions={data as any} />
                </div>
            </div>
        </div>
    );
}
