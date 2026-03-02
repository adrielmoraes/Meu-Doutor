'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, Calendar, Activity, TrendingUp, Clock,
  AlertTriangle, FileWarning, Search, Video, ArrowRight,
  Timer, CheckCircle, BarChart3, Zap, FileText, ClipboardList,
  Stethoscope, ShieldAlert, Cpu, PieChart as PieChartIcon, UserPlus,
  ChevronRight, Sparkles, Eye
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnlineStatusToggle } from "@/components/doctor/online-status-toggle";
import { useToast } from "@/hooks/use-toast";
import type { Doctor, Patient } from "@/types";
import { claimPatientAction } from "@/app/doctor/actions";
import PrescriptionModal from "@/components/doctor/prescription-modal";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface PendingExam {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  date: string;
  createdAt: Date;
}

interface UrgentCase {
  id: string;
  name: string;
  priority: string;
  lastVisit: string | null;
  avatar: string;
  pendingExams: number;
}

interface TodayAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar: string | null;
  time: string;
  type: string;
  status: string;
}

interface ActivityItem {
  id: string;
  type: 'prescription' | 'exam' | 'consultation' | 'patient';
  title: string;
  subtitle: string;
  timestamp: Date;
  patientName: string;
  status?: string;
}

interface DoctorDashboardImprovedProps {
  doctor: Doctor;
  totalPatients: number;
  upcomingAppointments: number;
  completedConsultations: number;
  pendingExams: PendingExam[];
  pendingExamsCount: number;
  urgentCases: UrgentCase[];
  todayAppointments: TodayAppointment[];
  avgValidationTime?: number;
  weeklyConsultations: number;
  patients: { id: string; name: string }[];
  activityTrends: { date: string; count: number }[];
  recentActivity: ActivityItem[];
  aiAssistCount: number;
  priorityDistribution: { name: string; value: number }[];
  globalPatientsCount?: number;
  globalPatients?: Patient[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  'Crítica': '#ef4444',
  'Alta': '#f97316',
  'Média': '#eab308',
  'Baixa': '#22c55e',
  'Normal': '#94a3b8'
};

const PRIORITY_BORDER: Record<string, string> = {
  'Crítica': 'border-l-red-500',
  'Alta': 'border-l-orange-500',
  'Média': 'border-l-yellow-500',
  'Baixa': 'border-l-green-500',
  'Normal': 'border-l-slate-300'
};

const PRIORITY_BG: Record<string, string> = {
  'Crítica': 'bg-red-50 dark:bg-red-950/30 text-red-700',
  'Alta': 'bg-orange-50 dark:bg-orange-950/30 text-orange-700',
  'Média': 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700',
  'Baixa': 'bg-green-50 dark:bg-green-950/30 text-green-700',
  'Normal': 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 dark:text-slate-600'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Agora';
  if (diffHours < 24) return `${diffHours}h atrás`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d atrás`;
}

// ─── PatientCard Sub-Component ────────────────────────────────────────────────

function PatientCard({
  id, name, avatar, priority, pendingExams, doctor, patients, linkHref
}: {
  id: string;
  name: string;
  avatar: string;
  priority: string;
  pendingExams: number;
  doctor: Doctor;
  patients: { id: string; name: string }[];
  linkHref: string;
}) {
  return (
    <Link href={linkHref} className="block group">
      <div className={`flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-l-4 ${PRIORITY_BORDER[priority] || 'border-l-slate-300'} hover:shadow-md transition-all duration-200 active:scale-[0.99]`}>
        <Avatar className="h-11 w-11 border-2 border-white shadow-sm shrink-0">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-600 font-bold text-sm">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-slate-900 dark:text-slate-50 group-hover:text-blue-700 transition-colors truncate leading-tight">
            {name}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tight border-none px-2 py-0.5 ${PRIORITY_BG[priority] || 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 dark:text-slate-600'}`}>
              {priority}
            </Badge>
            {pendingExams > 0 && (
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                {pendingExams} exame{pendingExams > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PrescriptionModal doctor={doctor} patients={patients} initialPatientId={id} variant="compact" />
          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DoctorDashboardImproved({
  doctor,
  totalPatients,
  upcomingAppointments,
  completedConsultations,
  pendingExams,
  pendingExamsCount,
  urgentCases,
  todayAppointments,
  weeklyConsultations,
  patients,
  activityTrends,
  recentActivity,
  aiAssistCount,
  priorityDistribution,
  globalPatientsCount,
  globalPatients
}: DoctorDashboardImprovedProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
  }, []);

  const stats = [
    { title: "Meus Pacientes", value: totalPatients, icon: <Users className="h-5 w-5" />, iconBg: "bg-blue-50 dark:bg-blue-950/30 text-blue-600" },
    { title: "Consultas Hoje", value: upcomingAppointments, icon: <Clock className="h-5 w-5" />, iconBg: "bg-violet-50 dark:bg-violet-950/30 text-violet-600" },
    { title: "Exames Pendentes", value: pendingExamsCount, icon: <FileWarning className="h-5 w-5" />, iconBg: "bg-amber-50 dark:bg-amber-950/30 text-amber-600", alert: pendingExamsCount > 0 },
    { title: "IA Assistências", value: aiAssistCount, icon: <Cpu className="h-5 w-5" />, iconBg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600", trend: "~4h/sem economizadas" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">

        {/* ─── Header: Greeting + Quick Actions ─── */}
        <header className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="pl-12 md:pl-0">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                Olá, Dr. {doctor.name.split(' ')[0]}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 text-[14px]">
                <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                {formattedDate}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <PrescriptionModal doctor={doctor} patients={patients} />
              <OnlineStatusToggle initialStatus={doctor.online || false} doctorName={doctor.name} />
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl mt-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <Input
              type="text"
              placeholder="Buscar paciente por nome, CPF ou prontuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-[15px]"
            />
            {searchQuery && (
              <Link href={`/doctor/patients?search=${encodeURIComponent(searchQuery)}`} className="absolute right-3 top-1/2 -translate-y-1/2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 w-8 p-0 min-h-[32px] min-w-[32px]">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className={`bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-2xl ${stat.alert ? 'ring-2 ring-amber-100' : ''}`}>
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl ${stat.iconBg}`}>{stat.icon}</div>
                  <p className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">{stat.title}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">{stat.value}</p>
                  {stat.alert && <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
                </div>
                {stat.trend && (
                  <p className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> {stat.trend}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── Main Tabs: Meus Pacientes / Mural de Casos ─── */}
        <Tabs defaultValue="my-patients" className="w-full mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-1 rounded-xl h-auto self-start">
              <TabsTrigger
                value="my-patients"
                className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md px-5 py-2.5 min-h-[44px] text-[14px] font-semibold transition-all"
              >
                <Users className="h-4 w-4 mr-2" />
                Meus Pacientes
                <Badge variant="secondary" className="ml-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 data-[state=active]:bg-white dark:bg-slate-900/20 data-[state=active]:text-white text-xs">{totalPatients}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="global-queue"
                className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md px-5 py-2.5 min-h-[44px] text-[14px] font-semibold transition-all"
              >
                <Timer className="h-4 w-4 mr-2" />
                Mural de Casos
                {(globalPatientsCount || 0) > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 data-[state=active]:bg-white dark:bg-slate-900/20 data-[state=active]:text-white text-xs">{globalPatientsCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 dark:text-slate-600 gap-2 font-semibold shadow-sm text-[14px] min-h-[44px] rounded-xl self-start" asChild>
              <Link href="/doctor/patients">
                Ver Todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* ─── Tab: Meus Pacientes ─── */}
          <TabsContent value="my-patients" className="mt-0 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-6">

              {/* Monitoramento Crítico */}
              <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50 dark:bg-slate-950/30 px-5 pt-5">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50 text-[16px] font-bold">
                    <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600"><AlertTriangle className="h-4 w-4" /></div>
                    Monitoramento Crítico
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400 text-[13px]">
                    Pacientes com alta prioridade
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <ScrollArea className="h-[340px] pr-2">
                    {urgentCases.length > 0 ? (
                      <div className="space-y-3">
                        {urgentCases.map((p) => (
                          <PatientCard
                            key={p.id}
                            id={p.id}
                            name={p.name}
                            avatar={p.avatar}
                            priority={p.priority}
                            pendingExams={p.pendingExams}
                            doctor={doctor}
                            patients={patients}
                            linkHref={`/doctor/patients/${p.id}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[280px] text-center">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-full mb-3">
                          <CheckCircle className="h-8 w-8 text-emerald-500" />
                        </div>
                        <p className="text-slate-900 dark:text-slate-50 font-bold text-[15px]">Sem urgências</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Nenhum caso requer atenção imediata.</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Agenda do Dia */}
              <Card className="lg:col-span-3 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50 dark:bg-slate-950/30 px-5 pt-5 flex flex-row items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50 text-[16px] font-bold">
                      <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600"><Calendar className="h-4 w-4" /></div>
                      Agenda do Dia
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 text-[13px]">
                      {todayAppointments.length} consulta{todayAppointments.length !== 1 ? 's' : ''} prevista{todayAppointments.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900 text-blue-600 border-blue-100 hover:bg-blue-50 dark:bg-blue-950/30 font-semibold shadow-sm rounded-lg min-h-[40px] text-[13px]" asChild>
                    <Link href="/doctor/schedule">Agenda Completa</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  <ScrollArea className="h-[340px] pr-2">
                    {todayAppointments.length > 0 ? (
                      <div className="space-y-3">
                        {todayAppointments.map((appt, index) => (
                          <div
                            key={appt.id}
                            className={`group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border active:scale-[0.99] ${index === 0
                                ? 'bg-blue-50 dark:bg-blue-950/30/60 border-blue-200 dark:border-blue-800 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-100 hover:shadow-sm'
                              }`}
                          >
                            <div className="text-center min-w-[56px]">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">hora</span>
                              <p className={`text-lg font-extrabold ${index === 0 ? 'text-blue-700' : 'text-slate-900 dark:text-slate-50'}`}>
                                {appt.time}
                              </p>
                            </div>
                            <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm shrink-0">
                              <AvatarImage src={appt.patientAvatar || ''} />
                              <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                                {appt.patientName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[15px] text-slate-900 dark:text-slate-50 group-hover:text-blue-700 transition-colors truncate leading-tight">{appt.patientName}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tight border-none px-2 py-0.5 ${appt.type.includes('Vídeo') ? 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30' : 'text-slate-600 dark:text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800'
                                  }`}>
                                  {appt.type}
                                </Badge>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Activity className="h-3 w-3" />{appt.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <PrescriptionModal doctor={doctor} patients={patients} initialPatientId={appt.patientId} variant="compact" />
                              {index === 0 && appt.type.includes('Vídeo') && (
                                <Link href={`/doctor/video-call?patient=${appt.patientId}`}>
                                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200/50 font-bold rounded-xl px-4 min-h-[44px] text-[14px]">
                                    <Video className="h-4 w-4 mr-1.5" /> Iniciar
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[280px] text-center">
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-full mb-3">
                          <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-900 dark:text-slate-50 font-bold text-[15px]">Sem consultas agendadas</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Aproveite para revisar prontuários pendentes.</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* ─── Tab: Mural de Casos (Global Queue) ─── */}
          <TabsContent value="global-queue" className="mt-0 outline-none">
            <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-50 bg-emerald-50 dark:bg-emerald-950/30/20 dark:bg-emerald-950/10 px-5 pt-5">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50 text-[16px] font-bold">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"><Timer className="h-4 w-4" /></div>
                  Pacientes no Mural
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-[13px]">
                  {globalPatientsCount || 0} pacientes aguardando triagem. Reivindique para sua fila.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-[420px] pr-2">
                  {(globalPatients && globalPatients.length > 0) ? (
                    <div className="space-y-3">
                      {globalPatients.map((patient) => (
                        <div
                          key={patient.id}
                          className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-l-4 ${PRIORITY_BORDER[patient.priority] || 'border-l-slate-300'} hover:shadow-md transition-all duration-200 active:scale-[0.99]`}
                        >
                          <Avatar className="h-11 w-11 border-2 border-white shadow-sm shrink-0">
                            <AvatarImage src={patient.avatar || ''} />
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-600 font-bold text-sm">
                              {patient.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-bold text-[15px] text-slate-900 dark:text-slate-50 truncate">{patient.name}</p>
                              <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tight border-none px-2 py-0.5 shrink-0 ${PRIORITY_BG[patient.priority] || 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 dark:text-slate-600'}`}>
                                {patient.priority}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Stethoscope className="h-3.5 w-3.5" />{patient.condition}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('pt-BR') : 'Nunca'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:mt-0 w-full sm:w-auto flex gap-2 shrink-0">
                            <Button
                              variant="outline"
                              className="flex-1 sm:flex-none text-blue-600 border-blue-100 hover:bg-blue-50 dark:bg-blue-950/30 font-semibold rounded-xl min-h-[44px] text-[14px]"
                              asChild
                            >
                              <Link href={`/doctor/patients/${patient.id}`}>
                                <Eye className="h-4 w-4 mr-1.5" /> Ver
                              </Link>
                            </Button>
                            <Button
                              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm min-h-[44px] text-[14px] active:scale-95 transition-transform"
                              onClick={async () => {
                                const result = await claimPatientAction(patient.id, doctor.id);
                                if (result.success) {
                                  toast({ title: "Paciente Reivindicado", description: "O paciente agora está na sua fila." });
                                  router.refresh();
                                } else {
                                  toast({ title: "Erro", description: result.message, variant: "destructive" });
                                }
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-1.5" /> Assumir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-full mb-4">
                        <UserPlus className="h-10 w-10 text-emerald-500" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">Mural Vazio</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-[14px]">Não há pacientes aguardando no momento.</p>
                    </div>
                  )}
                </ScrollArea>
                {(globalPatientsCount || 0) > 5 && (
                  <div className="mt-4 flex justify-center border-t border-slate-100 dark:border-slate-800 pt-4">
                    <Button variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30 font-semibold min-h-[44px] rounded-xl" asChild>
                      <Link href="/doctor/patients?tab=global">
                        Ver Mais ({globalPatientsCount})
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Analytics: Produtividade + Distribuição ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 mb-6 md:mb-8">
          <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50 dark:bg-slate-950/30 px-5 pt-5">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50 text-[16px] font-bold">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600"><TrendingUp className="h-4 w-4" /></div>
                Produtividade Clínica
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-[13px]">
                Consultas concluídas nos últimos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: 13 }}
                    itemStyle={{ fontWeight: 700 }}
                    labelStyle={{ fontWeight: 800, color: '#0f172a' }}
                  />
                  <Line type="monotone" dataKey="count" name="Consultas" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50 dark:bg-slate-950/30 px-5 pt-5">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50 text-[16px] font-bold">
                <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600"><PieChartIcon className="h-4 w-4" /></div>
                Perfil dos Pacientes
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-[13px]">
                Distribuição por risco clínico
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col justify-center">
              <div className="h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: 13 }} itemStyle={{ fontWeight: 700 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 px-2">
                {priorityDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[entry.name] }} />
                    <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-600 truncate">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Atividade Recente ─── */}
        <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden mb-10">
          <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50 dark:bg-slate-950/30 px-5 pt-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50 text-[16px] font-bold">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-600"><ClipboardList className="h-4 w-4" /></div>
                Atividade Recente
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-[13px]">
                Últimas interações clínicas
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-700 dark:text-slate-200 rounded-lg min-h-[40px] text-[13px]" asChild>
              <Link href="/doctor/history">Ver Tudo</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 md:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className={`p-2.5 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105 ${activity.type === 'prescription' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' :
                        activity.type === 'exam' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600' :
                          'bg-violet-50 dark:bg-violet-950/30 text-violet-600'
                      }`}>
                      {activity.type === 'prescription' ? <FileText className="h-5 w-5" /> :
                        activity.type === 'exam' ? <ShieldAlert className="h-5 w-5" /> :
                          <Stethoscope className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="font-bold text-[15px] text-slate-900 dark:text-slate-50 truncate">{activity.title}</p>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />{getTimeAgo(activity.timestamp.toISOString())}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[13px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[12px]">{activity.patientName}</span>
                        <span className="opacity-70">•</span>
                        <span className="truncate">{activity.subtitle}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-full inline-block mb-3">
                    <Activity className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-900 dark:text-slate-50 font-bold text-[15px]">Nenhuma atividade</p>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Os registros aparecerão aqui quando iniciar atendimentos.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
