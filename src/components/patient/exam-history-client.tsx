"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ChevronRight, Droplets, Bone, Trash2, AlertTriangle, Activity, Microscope, ScanLine, Search, Filter, Calendar as CalendarIcon, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExamTimelineChart } from "@/components/patient/exam-timeline-chart";
import DeleteExamButton from "@/components/patient/delete-exam-button";
import type { Exam } from "@/types";

// --- HELPERS ---

const iconMap: { [key: string]: React.ReactNode } = {
    'Droplets': <Droplets className="h-5 w-5 text-white" />,
    'Bone': <Bone className="h-5 w-5 text-white" />,
    'FileText': <FileText className="h-5 w-5 text-white" />,
    'Activity': <Activity className="h-5 w-5 text-white" />,
    'Microscope': <Microscope className="h-5 w-5 text-white" />,
    'ScanLine': <ScanLine className="h-5 w-5 text-white" />,
    'default': <FileText className="h-5 w-5 text-white" />,
};

const categoryConfig: Record<string, { color: string; iconKey: string; bg: string; text: string; border: string }> = {
    'Exames de Sangue': {
        color: 'from-red-500 to-rose-600',
        iconKey: 'Droplets',
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
    },
    'Exames de Fezes': {
        color: 'from-amber-500 to-orange-600',
        iconKey: 'Microscope',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
    },
    'Exames de Urina': {
        color: 'from-yellow-500 to-amber-600',
        iconKey: 'Activity',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800',
    },
    'Raio-X': {
        color: 'from-purple-500 to-violet-600',
        iconKey: 'ScanLine',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
    },
    'Tomografia': {
        color: 'from-blue-500 to-cyan-600',
        iconKey: 'Bone',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
    },
    'Outros': {
        color: 'from-gray-500 to-slate-600',
        iconKey: 'FileText',
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-700',
    }
};

function getCategory(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('sangue')) return 'Exames de Sangue';
    if (t.includes('fezes') || t.includes('fecal')) return 'Exames de Fezes';
    if (t.includes('urina')) return 'Exames de Urina';
    if (t.includes('raio-x') || t.includes('raio x')) return 'Raio-X';
    if (t.includes('tomografia') || t.includes('ct') || t.includes('tac')) return 'Tomografia';
    return 'Outros';
}

function groupExamsByType(exams: Exam[]): Record<string, Exam[]> {
    const grouped: Record<string, Exam[]> = {};
    exams.forEach((exam) => {
        const category = getCategory(exam.type);
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(exam);
    });
    return grouped;
}

// --- COMPONENT ---

export function ExamHistoryClient({ exams, patientId }: { exams: Exam[], patientId: string }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");

    // Filter Logic
    const filteredExams = exams.filter(exam => {
        const matchesSearch = exam.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exam.preliminaryDiagnosis.toLowerCase().includes(searchTerm.toLowerCase());
        const category = getCategory(exam.type);
        const matchesCategory = filterCategory === "all" || category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const groupedExams = groupExamsByType(filteredExams);

    // Stats
    const totalExams = exams.length;
    const lastExamDate = totalExams > 0 ? new Date(Math.max(...exams.map(e => new Date(e.date).getTime()))).toLocaleDateString() : "N/A";
    const pendingValidation = exams.filter(e => e.status !== 'Validado').length;

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card/50 backdrop-blur border-border/60">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><FileText className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase">Total de Exames</p>
                            <p className="text-2xl font-bold text-foreground">{totalExams}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-border/60">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-600"><CalendarIcon className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase">Último Exame</p>
                            <p className="text-xl font-bold text-foreground">{lastExamDate}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-border/60 col-span-2 md:col-span-2">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600"><Activity className="h-5 w-5" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Status</p>
                                <div className="flex gap-3 text-sm font-medium mt-0.5">
                                    <span className="text-green-600">{totalExams - pendingValidation} Validados</span>
                                    <span className="text-amber-600">{pendingValidation} Pendentes</span>
                                </div>
                            </div>
                        </div>
                        {pendingValidation > 0 && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                                Aguardando Análise
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome do exame ou diagnóstico..."
                        className="pl-9 bg-card"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-card">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Categorias</SelectItem>
                        {Object.keys(categoryConfig).map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {filteredExams.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-card/30">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Nenhum exame encontrado</h3>
                    <p className="text-muted-foreground">Tente ajustar seus filtros ou busca.</p>
                </div>
            ) : (
                <Tabs defaultValue="timeline" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1">
                        <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                        <TabsTrigger value="charts">Gráficos de Evolução</TabsTrigger>
                        <TabsTrigger value="list">Lista Detalhada</TabsTrigger>
                    </TabsList>

                    {/* TIMELINE VIEW */}
                    <TabsContent value="timeline" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {Object.entries(groupedExams).map(([category, categoryExams]) => {
                            const config = categoryConfig[category] || categoryConfig['Outros'];
                            const sortedExams = [...categoryExams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                            return (
                                <Card key={category} className={`overflow-hidden border-2 ${config.border} bg-card/80 shadow-sm`}>
                                    <div className={`px-6 py-4 bg-gradient-to-r ${config.bg} border-b ${config.border} flex items-center gap-3`}>
                                        <div className={`p-3 rounded-lg bg-gradient-to-br ${config.color} shadow-sm`}>
                                            {iconMap[config.iconKey]}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-lg font-bold ${config.text}`}>{category}</h3>
                                            <p className="text-xs text-muted-foreground">{sortedExams.length} exames</p>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="relative space-y-8">
                                            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-muted-foreground/20" />
                                            {sortedExams.map((exam) => (
                                                <div key={exam.id} className="relative pl-10 group">
                                                    <div className={`absolute left-[13px] top-2 w-2.5 h-2.5 rounded-full border-2 border-background ring-2 ring-primary ${config.bg.split(' ')[0]}`} />

                                                    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all group-hover:border-primary/50">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-bold text-foreground text-base">{exam.type}</h4>
                                                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                        <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {new Date(exam.date).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                                <Badge variant={exam.status === 'Validado' ? 'default' : 'secondary'} className={exam.status === 'Validado' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : ''}>
                                                                    {exam.status}
                                                                </Badge>
                                                            </div>

                                                            {/* Main Result */}
                                                            {exam.results && exam.results.length > 0 && (
                                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                                    {exam.results.slice(0, 4).map((res, i) => (
                                                                        <div key={i} className="text-xs p-1.5 rounded bg-muted/50 border border-border/50">
                                                                            <span className="block text-muted-foreground font-medium truncate">{res.name}</span>
                                                                            <span className="block font-bold text-foreground">{res.value}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col justify-between items-end gap-2">
                                                            <DeleteExamButton patientId={patientId} examId={exam.id} />
                                                            <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs" asChild>
                                                                <Link href={`/patient/history/${exam.id}`}>
                                                                    Análise Completa <ArrowUpRight className="ml-2 h-3 w-3" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </TabsContent>

                    {/* CHARTS VIEW */}
                    <TabsContent value="charts" className="space-y-6">
                        {Object.entries(groupedExams).map(([category, categoryExams]) => {
                            const config = categoryConfig[category] || categoryConfig['Outros'];
                            return (
                                <ExamTimelineChart
                                    key={category}
                                    exams={categoryExams}
                                    examType={category}
                                    color={config.color}
                                    icon={iconMap[config.iconKey]}
                                />
                            );
                        })}
                    </TabsContent>

                    {/* LIST VIEW */}
                    <TabsContent value="list" className="space-y-3">
                        {filteredExams.map((exam) => (
                            <Link href={`/patient/history/${exam.id}`} key={exam.id} className="block group">
                                <Card className="border-border hover:border-primary/50 transition-all hover:shadow-sm">
                                    <div className="p-4 flex items-center gap-4">
                                        <div className={`p-3 rounded-xl bg-muted group-hover:bg-primary/5 transition-colors`}>
                                            <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-foreground truncate">{exam.type}</h4>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                {new Date(exam.date).toLocaleDateString()}
                                                <span className="text-border">•</span>
                                                <span className={exam.status === 'Validado' ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{exam.status}</span>
                                            </p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
