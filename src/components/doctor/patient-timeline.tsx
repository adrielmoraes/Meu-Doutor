"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, FileText, Clock, AlertCircle } from "lucide-react";
import type { Patient, Exam } from "@/types";

interface PatientTimelineProps {
    exams: Exam[];
    patient: Patient;
}

export default function PatientTimeline({ exams, patient }: PatientTimelineProps) {
    // Sort exams by date descending
    const sortedExams = [...exams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card className="bg-white border-slate-200 h-full shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Linha do Tempo Clínica
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative pl-4 border-l-2 border-slate-100 space-y-8 ml-2">
                    {/* Last Visit Marker if available */}
                    {patient.lastVisit && (
                        <div className="relative">
                            <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                                    <Clock className="h-3 w-3" />
                                    Última Interação
                                </span>
                                <span className="text-sm text-slate-900 font-semibold">
                                    {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>
                    )}

                    {sortedExams.map((exam) => (
                        <div key={exam.id} className="relative group">
                            <span className={`absolute -left-[21px] top-4 h-3 w-3 rounded-full ring-4 ring-white transition-all duration-300 ${exam.status === 'Validado'
                                    ? 'bg-emerald-500 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                    : 'bg-slate-300 group-hover:shadow-[0_0_8px_rgba(148,163,184,0.3)]'
                                }`} />

                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(exam.date).toLocaleDateString('pt-BR')}
                                </span>

                                <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all duration-300 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            {exam.type}
                                        </span>
                                        <Badge variant="outline" className={`text-[10px] h-5 px-2 font-semibold ${exam.status === 'Validado'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                            {exam.status}
                                        </Badge>
                                    </div>

                                    {exam.preliminaryDiagnosis ? (
                                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                            {exam.preliminaryDiagnosis}
                                        </p>
                                    ) : (
                                        <div className="flex items-center gap-1 text-xs text-slate-400 italic">
                                            <AlertCircle className="h-3 w-3" />
                                            Aguardando análise
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {sortedExams.length === 0 && !patient.lastVisit && (
                        <div className="text-sm text-slate-400 italic pl-2 py-4">
                            Nenhum evento registrado no histórico clínico.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
