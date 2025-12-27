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
        <Card className="bg-slate-900/50 border-slate-800 h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-200">
                    <Activity className="h-5 w-5 text-cyan-400" />
                    Linha do Tempo Clínica
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative pl-4 border-l-2 border-slate-700 space-y-8 ml-2">
                    {/* Last Visit Marker if available */}
                    {patient.lastVisit && (
                        <div className="relative">
                            <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-cyan-500 ring-4 ring-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                            <div className="flex flex-col">
                                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                                    <Clock className="h-3 w-3" />
                                    Última Interação
                                </span>
                                <span className="text-sm text-slate-200 font-medium">
                                    {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>
                    )}

                    {sortedExams.map((exam) => (
                        <div key={exam.id} className="relative group">
                            <span className={`absolute -left-[21px] top-4 h-3 w-3 rounded-full ring-4 ring-slate-900 transition-all duration-300 ${
                                exam.status === 'Validado' 
                                    ? 'bg-green-500 group-hover:shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                                    : 'bg-slate-500 group-hover:shadow-[0_0_10px_rgba(100,116,139,0.5)]'
                            }`} />
                            
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(exam.date).toLocaleDateString('pt-BR')}
                                </span>
                                
                                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-cyan-500/30 hover:bg-slate-800 transition-all duration-300 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-cyan-400" />
                                            {exam.type}
                                        </span>
                                        <Badge variant="outline" className={`text-[10px] h-5 ${
                                            exam.status === 'Validado' 
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        }`}>
                                            {exam.status}
                                        </Badge>
                                    </div>
                                    
                                    {exam.preliminaryDiagnosis ? (
                                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                                            {exam.preliminaryDiagnosis}
                                        </p>
                                    ) : (
                                        <div className="flex items-center gap-1 text-xs text-slate-500 italic">
                                            <AlertCircle className="h-3 w-3" />
                                            Aguardando análise
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {sortedExams.length === 0 && !patient.lastVisit && (
                        <div className="text-sm text-slate-500 italic pl-2 py-4">
                            Nenhum evento registrado no histórico clínico.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
