
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { getPatients } from "@/lib/db-adapter";
import { getSession } from "@/lib/session";
import PrescriptionModal from "@/components/doctor/prescription-modal";
import type { Patient } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { redirect } from "next/navigation";

// Helper function to extract the diagnosis from doctor's notes
const getValidatedDiagnosis = (patient: Patient): string => {
    if (patient.status !== 'Validado' || !patient.doctorNotes) {
        return 'N/A';
    }
    // Extracts the first line of the notes, assuming it's the diagnosis.
    return patient.doctorNotes.split('\n')[0] || 'Diagnóstico não especificado';
}

async function getHistoryData(): Promise<{ history: Patient[], error?: string }> {
    try {
        const allPatients = await getPatients();
        const history = allPatients.filter((p: Patient) => p.status === 'Validado');
        return { history };
    } catch (e: any) {
        console.error("Unexpected error fetching history:", e);
        return { history: [], error: "Ocorreu um erro inesperado ao carregar o histórico." };
    }
}


export default async function ProfessionalHistoryPage() {
    const session = await getSession();
    if (!session || session.role !== 'doctor') {
        redirect('/login');
    }

    const { history, error } = await getHistoryData();

    return (
        <div className="bg-slate-50 min-h-screen relative font-sans text-slate-900">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-60"></div>

            <div className="relative z-10 container mx-auto p-4 md:p-8">
                <div className="mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 backdrop-blur-sm">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800 font-bold uppercase tracking-wider">Histórico Profissional</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Atendimentos Realizados
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
                        Revise todos os pacientes que você atendeu e os diagnósticos que validou na plataforma Dr.IA.
                    </p>
                </div>

                {error ? (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 shadow-sm border-none ring-1 ring-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-bold uppercase tracking-tight">Erro ao Carregar Histórico</AlertTitle>
                        <AlertDescription className="font-medium">
                            {error}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="text-slate-900 font-extrabold h-14">Paciente</TableHead>
                                    <TableHead className="hidden md:table-cell text-slate-900 font-extrabold h-14">Data do Atendimento</TableHead>
                                    <TableHead className="text-slate-900 font-extrabold h-14">Diagnóstico Validado</TableHead>
                                    <TableHead className="text-right text-slate-900 font-extrabold h-14 pr-8">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map(entry => (
                                    <TableRow key={entry.id} className="hover:bg-blue-50/30 transition-colors border-slate-50">
                                        <TableCell className="py-5 pl-8">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                                    <AvatarFallback className="bg-blue-600 text-white font-bold">
                                                        {entry.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold text-slate-900">{entry.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell py-5">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-sm font-bold">
                                                {entry.lastVisit}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <p className="font-medium text-slate-700 leading-relaxed max-w-md line-clamp-2">
                                                {getValidatedDiagnosis(entry)}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-right py-5 pr-8 flex items-center justify-end gap-1">
                                            <PrescriptionModal
                                                doctor={{ id: session.userId }}
                                                patients={[entry]}
                                                initialPatientId={entry.id}
                                                variant="compact"
                                            />
                                            <Button asChild variant="ghost" size="icon" className="hover:bg-blue-600 hover:text-white transition-all rounded-full h-10 w-10">
                                                <Link href={`/doctor/patients/${entry.id}`}>
                                                    <Eye className="h-5 w-5" />
                                                    <span className="sr-only">Ver Detalhes do Caso</span>
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {history.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-slate-500 py-16">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-slate-100 p-4 rounded-full">
                                                    <Eye className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <p className="font-medium text-lg">Nenhum atendimento validado encontrado.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
