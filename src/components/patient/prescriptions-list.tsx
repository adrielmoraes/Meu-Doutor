"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FileSignature, FileText, Download, Calendar,
    CheckCircle2, Clock, MapPin, User, ChevronRight,
    Search, Filter, Activity, ShieldCheck, Bot, Loader2, Play
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { explainPatientDocumentAction } from "@/app/patient/prescriptions/actions";
import AudioPlayback from "@/components/patient/audio-playback";
import { useToast } from "@/hooks/use-toast";

interface Prescription {
    id: string;
    type: 'receita' | 'atestado' | 'laudo' | 'outro';
    title: string | null;
    status: 'draft' | 'pending_process' | 'signed' | 'error';
    createdAt: Date;
    signedPdfUrl: string | null;
    doctorName: string;
    specialty: string;
    aiExplanation: string | null;
    aiExplanationAudioUri: string | null;
}

export default function PrescriptionsList({ prescriptions: initialPrescriptions }: { prescriptions: Prescription[] }) {
    const { toast } = useToast();
    const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [explainingId, setExplainingId] = useState<string | null>(null);

    const handleExplain = async (id: string) => {
        setExplainingId(id);
        try {
            const result = await explainPatientDocumentAction(id);
            if (result.success) {
                setPrescriptions(prev => prev.map(p =>
                    p.id === id ? { ...p, aiExplanation: result.explanation || null, aiExplanationAudioUri: result.audioUrl || null } : p
                ));
                toast({ title: "Explicação gerada!", description: "A IA traduziu seu documento para uma linguagem simples." });
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro inesperado", variant: "destructive" });
        } finally {
            setExplainingId(null);
        }
    };

    const filtered = prescriptions.filter(p => {
        const matchesSearch = (p.title || p.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || p.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'receita': return {
                icon: <Activity className="h-5 w-5" />,
                label: 'Receita Médica',
                bg: 'bg-blue-50 dark:bg-blue-900/30',
                text: 'text-blue-600 dark:text-blue-400'
            };
            case 'atestado': return {
                icon: <FileText className="h-5 w-5" />,
                label: 'Atestado Médico',
                bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                text: 'text-emerald-600 dark:text-emerald-400'
            };
            case 'laudo': return {
                icon: <ShieldCheck className="h-5 w-5" />,
                label: 'Laudo Clínico',
                bg: 'bg-amber-50 dark:bg-amber-950/30',
                text: 'text-amber-600 dark:text-amber-400'
            };
            default: return {
                icon: <FileSignature className="h-5 w-5" />,
                label: 'Documento',
                bg: 'bg-slate-50 dark:bg-slate-800/30',
                text: 'text-slate-600 dark:text-slate-400'
            };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Intro - Removed as it's now in the page.tsx */}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título ou médico..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/20 dark:border-white/5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl text-slate-900 dark:text-slate-100 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/20 dark:border-white/5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl text-slate-900 dark:text-slate-100 appearance-none cursor-pointer shadow-sm transition-all"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all" className="bg-white dark:bg-slate-950">Todos os tipos</option>
                        <option value="receita" className="bg-white dark:bg-slate-950">Receitas</option>
                        <option value="atestado" className="bg-white dark:bg-slate-950">Atestados</option>
                        <option value="laudo" className="bg-white dark:bg-slate-950">Laudos</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filtered.length > 0 ? (
                    filtered.map((item) => {
                        const config = getTypeConfig(item.type);
                        const isSigned = item.status === 'signed';

                        return (
                            <Card key={item.id} className="group border-0 ring-1 ring-white/20 dark:ring-white/5 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 rounded-[2rem] overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl">
                                <CardContent className="p-0">
                                    <div className="flex items-stretch">
                                        {/* Status Sidebar */}
                                        <div className={`w-2 ${isSigned ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>

                                        <div className="flex-1 p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-3 rounded-2xl ${config.bg} ${config.text}`}>
                                                        {config.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
                                                            {item.title || config.label}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(item.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge className={isSigned ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-none ring-1 ring-emerald-200 dark:ring-emerald-900/50" : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-none ring-1 ring-amber-200 dark:ring-amber-900/50"}>
                                                    {isSigned ? "Assinado" : "Pendente"}
                                                </Badge>
                                            </div>

                                            <div className="bg-white/40 dark:bg-slate-800/40 rounded-3xl p-5 mb-6 border border-white/40 dark:border-white/5 flex items-center justify-between backdrop-blur-md">
                                                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white text-base shadow-lg ring-4 ring-primary/10">
                                                        {item.doctorName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-slate-800 dark:text-white text-base">{item.doctorName}</p>
                                                        <p className="text-xs font-bold text-primary tracking-wide uppercase">{item.specialty}</p>
                                                    </div>
                                                </div>
                                                <div className="hidden sm:block text-right">
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1.5">Certificação Digital</p>
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">ICP-Brasil</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {item.signedPdfUrl ? (
                                                    <>
                                                        <Button
                                                            className="flex-1 bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-900 font-extrabold rounded-2xl h-12 shadow-lg transition-all active:scale-95"
                                                            onClick={() => window.open(item.signedPdfUrl || '', '_blank')}
                                                        >
                                                            <FileText className="h-5 w-5 mr-2" /> Visualizar Documento
                                                        </Button>

                                                        {!item.aiExplanation && (
                                                            <Button
                                                                variant="outline"
                                                                className="flex-1 border-primary/30 dark:border-primary/20 text-primary hover:bg-primary/5 dark:hover:bg-primary/10 font-extrabold rounded-2xl h-12 backdrop-blur-sm transition-all"
                                                                onClick={() => handleExplain(item.id)}
                                                                disabled={explainingId === item.id}
                                                            >
                                                                {explainingId === item.id ? (
                                                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                                ) : (
                                                                    <Bot className="h-5 w-5 mr-2" />
                                                                )}
                                                                Tradutor de IA
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="outline"
                                                            className="sm:w-14 h-12 rounded-2xl border-white/20 dark:border-white/5 bg-white/20 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 transition-all active:scale-90"
                                                            onClick={() => {
                                                                const link = document.createElement('a');
                                                                link.href = item.signedPdfUrl || '';
                                                                link.download = `documento-${item.id}.pdf`;
                                                                link.click();
                                                            }}
                                                        >
                                                            <Download className="h-5 w-5" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <div className="flex-1 flex items-center justify-center p-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 italic text-slate-400 dark:text-slate-500 text-sm font-bold">
                                                        Em processamento pelo médico...
                                                    </div>
                                                )}
                                            </div>

                                            {/* AI Explanation Area */}
                                            {item.aiExplanation && (
                                                <div className="mt-6 p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5">
                                                        <Bot className="h-20 w-20 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="relative">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
                                                                <Bot className="h-5 w-5" /> Explicação da IA
                                                            </div>
                                                            {item.aiExplanationAudioUri && (
                                                                <AudioPlayback
                                                                    textToSpeak={item.aiExplanation}
                                                                    preGeneratedAudioUri={item.aiExplanationAudioUri}
                                                                    label="Ouvir Explicação"
                                                                    variant="ghost"
                                                                    className="h-8 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 p-2 font-bold"
                                                                />
                                                            )}
                                                        </div>
                                                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic">
                                                            "{item.aiExplanation}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                ) : (
                    <div className="col-span-full py-24 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-2 border-dashed border-white/30 dark:border-white/10 rounded-[3rem] shadow-inner">
                        <div className="bg-primary/10 p-8 rounded-full inline-block mb-6 ring-8 ring-primary/5 animate-pulse">
                            <Clock className="h-12 w-12 text-primary opacity-60" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Sua galeria está vazia</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">Assim que seu médico assinar uma receita ou atestado, ele aparecerá aqui com este novo visual premium.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
