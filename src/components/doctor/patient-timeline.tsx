"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, FileText, Clock, AlertCircle, Stethoscope, Pill, Download, MessageSquare } from "lucide-react";
import type { Patient, Exam, Consultation, Prescription } from "@/types";

interface PatientTimelineProps {
    exams: Exam[];
    consultations: Consultation[];
    prescriptions: Prescription[];
    patient: Patient;
}

type TimelineItem =
    | { type: 'exam'; date: Date; data: Exam }
    | { type: 'consultation'; date: Date; data: Consultation }
    | { type: 'prescription'; date: Date; data: Prescription };

export default function PatientTimeline({ exams, consultations, prescriptions, patient }: PatientTimelineProps) {
    // Combine and sort all items by date descending
    const timelineItems: TimelineItem[] = [
        ...exams.map(exam => ({ type: 'exam' as const, date: new Date(exam.date), data: exam })),
        ...consultations.map(cons => ({ type: 'consultation' as const, date: new Date(cons.date), data: cons })),
        ...prescriptions.map(pres => ({ type: 'prescription' as const, date: new Date(pres.createdAt), data: pres }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <Card className="bg-white border-slate-200 h-full shadow-sm border-none ring-1 ring-slate-200">
            <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Linha do Tempo Clínica
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
                                    {new Date(patient.lastVisit).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    )}

                    {timelineItems.map((item, index) => (
                        <div key={`${item.type}-${index}`} className="relative group">
                            <span className={`absolute -left-[21px] top-4 h-3 w-3 rounded-full ring-4 ring-white transition-all duration-300 ${item.type === 'exam'
                                    ? (item.data.status === 'Validado' ? 'bg-emerald-500 shadow-sm' : 'bg-amber-400')
                                    : item.type === 'consultation'
                                        ? 'bg-blue-500'
                                        : 'bg-violet-500'
                                }`} />

                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {item.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </span>

                                <div className="p-4 rounded-xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                                    {item.type === 'exam' && (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    Exame: {item.data.type}
                                                </span>
                                                <Badge variant="outline" className={`text-[10px] h-5 px-2 font-semibold ${item.data.status === 'Validado'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                    {item.data.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                                {item.data.doctorNotes || item.data.preliminaryDiagnosis || "Aguardando análise detalhada."}
                                            </p>
                                        </>
                                    )}

                                    {item.type === 'consultation' && (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    <Stethoscope className="h-4 w-4 text-emerald-500" />
                                                    Evolução Clínica
                                                </span>
                                                <Badge variant="outline" className="text-[10px] h-5 px-2 font-semibold bg-blue-50 text-blue-700 border-blue-100">
                                                    {item.data.type === 'video-call' ? 'Vídeo' : 'Nota'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-600 font-medium">
                                                {item.data.summary}
                                            </p>
                                        </>
                                    )}

                                    {item.type === 'prescription' && (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    <Pill className="h-4 w-4 text-violet-500" />
                                                    {item.data.type.charAt(0).toUpperCase() + item.data.type.slice(1)}: {item.data.title || "Sem título"}
                                                </span>
                                                {item.data.signedPdfUrl && (
                                                    <a href={item.data.signedPdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="space-y-1 mt-2">
                                                {item.data.medications.slice(0, 2).map((med, i) => (
                                                    <div key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5 pl-2 border-l border-slate-200">
                                                        <span className="font-bold text-slate-700">{med.name}</span>
                                                        <span>{med.dosage}</span>
                                                    </div>
                                                ))}
                                                {item.data.medications.length > 2 && (
                                                    <p className="text-[10px] text-slate-400 italic mt-1">
                                                        + {item.data.medications.length - 2} outros medicamentos
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {timelineItems.length === 0 && !patient.lastVisit && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="bg-slate-50 p-4 rounded-full mb-3">
                                <Activity className="h-8 w-8 text-slate-200" />
                            </div>
                            <p className="text-sm text-slate-400 font-medium">Nenhum evento registrado no histórico clínico.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
