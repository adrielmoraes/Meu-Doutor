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
  Users, Calendar, History, Sparkles, Activity, TrendingUp, Clock,
  AlertTriangle, FileWarning, Search, Video, ArrowRight,
  Timer, CheckCircle, BarChart3, Zap, Bell, Heart, UserCircle, Settings,
  Menu, LogOut, User, FileText, ClipboardList, Briefcase, ChevronRight,
  Stethoscope, ShieldAlert, Cpu, PieChart as PieChartIcon
} from "lucide-react";
import Link from "next/link";
import { OnlineStatusToggle } from "@/components/doctor/online-status-toggle";
import type { Doctor } from "@/types";
import MediAILogo from "@/components/layout/mediai-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PrescriptionModal from "@/components/doctor/prescription-modal";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie
} from 'recharts';

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
}

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
  priorityDistribution
}: DoctorDashboardImprovedProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const stats = [
    {
      title: "Total de Pacientes",
      value: totalPatients,
      icon: <Users className="h-5 w-5 text-blue-600" />,
      color: "blue"
    },
    {
      title: "Consultas Agendadas",
      value: upcomingAppointments,
      icon: <Clock className="h-5 w-5 text-violet-600" />,
      color: "violet"
    },
    {
      title: "Assistência de IA",
      value: aiAssistCount,
      icon: <Cpu className="h-5 w-5 text-emerald-600" />,
      color: "emerald",
      trend: "Economizando ~4h/semana"
    },
    {
      title: "Exames Pendentes",
      value: pendingExamsCount,
      icon: <FileWarning className="h-5 w-5 text-amber-600" />,
      color: "amber",
      alert: pendingExamsCount > 0
    },
    {
      title: "Consultas (Semana)",
      value: weeklyConsultations,
      icon: <BarChart3 className="h-5 w-5 text-indigo-600" />,
      color: "indigo"
    },
    {
      title: "Validações",
      value: doctor.validations || 0,
      icon: <CheckCircle className="h-5 w-5 text-teal-600" />,
      color: "teal"
    }
  ];

  const PRIORITY_COLORS: Record<string, string> = {
    'Crítica': '#ef4444',
    'Alta': '#f97316',
    'Média': '#facc15',
    'Baixa': '#22c55e',
    'Normal': '#94a3b8'
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  return (
    <div className="bg-slate-50 min-h-screen relative font-sans text-slate-900">
      {/* Background Decor - Subtle & Clean */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-60"></div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <MediAILogo className="h-10 w-auto text-blue-600" />
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">Portal do Médico</span>
              </div>
              <PrescriptionModal doctor={doctor} patients={patients} />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 px-2 py-1 h-auto hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={doctor.avatar || ''} alt={doctor.name} />
                    <AvatarFallback className="bg-blue-600 text-white font-bold">
                      {doctor.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900 leading-none">{doctor.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{doctor.specialty}</p>
                  </div>
                  <Menu className="h-4 w-4 text-slate-400 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white border-slate-200 shadow-lg text-slate-700"
              >
                <DropdownMenuLabel className="text-slate-900">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem asChild>
                  <Link href="/doctor/profile" className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                    <User className="h-4 w-4 text-slate-500" />
                    <span>Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/doctor/settings" className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                    <Settings className="h-4 w-4 text-slate-500" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Olá, Dr. {doctor.name.split(' ')[0]}
              </h1>
              <p className="text-slate-500 mt-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                {formattedDate}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OnlineStatusToggle initialStatus={doctor.online || false} doctorName={doctor.name} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-lg shadow-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar paciente por nome, CPF ou prontuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all"
            />
            {searchQuery && (
              <Link
                href={`/doctor/patients?search=${encodeURIComponent(searchQuery)}`}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 w-8 p-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Primary Navigation Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/doctor/patients" className="block group">
            <Card className="h-full bg-white border-none ring-1 ring-slate-200 shadow-sm group-hover:ring-blue-300 group-hover:shadow-md transition-all rounded-2xl overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-900 group-hover:text-blue-700 block">Meus Pacientes</span>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Gerenciar prontuários e exames</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/doctor/history" className="block group">
            <Card className="h-full bg-white border-none ring-1 ring-slate-200 shadow-sm group-hover:ring-indigo-300 group-hover:shadow-md transition-all rounded-2xl overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 block">Histórico Clínico</span>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Atendimentos realizados</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/doctor/schedule" className="block group">
            <Card className="h-full bg-white border-none ring-1 ring-slate-200 shadow-sm group-hover:ring-emerald-300 group-hover:shadow-md transition-all rounded-2xl overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 block">Agenda Magistral</span>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Planejamento e turnos</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Grid - Now more compact and comprehensive */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={stat.title}
              className={`group bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 ${stat.alert ? 'ring-2 ring-amber-100' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-1.5 rounded-lg ${index % 6 === 0 ? 'bg-blue-50 text-blue-600' :
                      index % 6 === 1 ? 'bg-violet-50 text-violet-600' :
                        index % 6 === 2 ? 'bg-emerald-50 text-emerald-600' :
                          index % 6 === 3 ? 'bg-amber-50 text-amber-600' :
                            index % 6 === 4 ? 'bg-indigo-50 text-indigo-600' :
                              'bg-teal-50 text-teal-600'
                    }`}>
                    {stat.icon}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{stat.title}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
                  {stat.alert && <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
                </div>
                {stat.trend && (
                  <p className="text-[9px] font-bold text-emerald-600 mt-1 flex items-center gap-1 uppercase tracking-tighter">
                    <Zap className="h-2.5 w-2.5" /> {stat.trend}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 border-none ring-1 ring-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
                <div className="p-2 rounded-xl bg-blue-100/50 text-blue-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Produtividade Clínica
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium tracking-tight">
                Consultas concluídas nos últimos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 700, fontSize: 12 }}
                    labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Consultas"
                    stroke="#2563eb"
                    strokeWidth={4}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none ring-1 ring-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
                <div className="p-2 rounded-xl bg-violet-100/50 text-violet-600">
                  <PieChartIcon className="h-5 w-5" />
                </div>
                Perfil dos Pacientes
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium tracking-tight">
                Distribuição por risco clínico
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 h-[300px] flex flex-col justify-center">
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 700, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {priorityDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[entry.name] }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Urgent Cases */}
          <Card className={`lg:col-span-1 border-none ring-1 ring-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl ${urgentCases.length > 0 ? '' : 'opacity-80'}`}>
            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
                <div className="p-2 rounded-xl bg-red-100/50 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                Monitoramento Crítico
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Sinalizando pacientes com alta prioridade
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ScrollArea className="h-[300px] pr-4">
                {urgentCases.length > 0 ? (
                  <div className="space-y-4">
                    {urgentCases.map((patient) => (
                      <Link
                        key={patient.id}
                        href={`/doctor/patients/${patient.id}`}
                        className="block group"
                      >
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 group-hover:bg-red-50 group-hover:border-red-200 transition-all duration-300 shadow-sm hover:shadow-md">
                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                            <AvatarImage src={patient.avatar} />
                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                              {patient.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-red-700 transition-colors truncate">{patient.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tight border-none ${patient.priority === 'Crítica' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                {patient.priority}
                              </Badge>
                              {patient.pendingExams > 0 && (
                                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                  {patient.pendingExams} EXAME(S)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <PrescriptionModal
                              doctor={doctor}
                              patients={patients}
                              initialPatientId={patient.id}
                              variant="compact"
                            />
                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-red-500 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[260px] text-center">
                    <div className="bg-emerald-50 p-4 rounded-full mb-4">
                      <CheckCircle className="h-10 w-10 text-emerald-500 opacity-60" />
                    </div>
                    <p className="text-slate-900 font-bold">Protocolo Estável</p>
                    <p className="text-xs text-slate-500 mt-1">Nenhum caso requer atenção imediata.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="lg:col-span-2 border-none ring-1 ring-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/50 flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
                  <div className="p-2 rounded-xl bg-blue-100/50 text-blue-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  Agenda Magistral
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium">
                  {todayAppointments.length} consultas previstas para o seu turno
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="bg-white text-blue-600 border-blue-100 hover:bg-blue-50 font-bold shadow-sm shadow-blue-50" asChild>
                <Link href="/doctor/schedule">Módulo Agenda</Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <ScrollArea className="h-[300px] pr-4">
                {todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((appt, index) => (
                      <div
                        key={appt.id}
                        className={`group flex items-center gap-6 p-5 rounded-2xl transition-all duration-300 border ${index === 0
                          ? 'bg-blue-50 border-blue-200 shadow-md shadow-blue-100/50'
                          : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'
                          }`}
                      >
                        <div className="text-center min-w-[70px]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">HORÁRIO</span>
                          <p className={`text-xl font-extrabold ${index === 0 ? 'text-blue-700' : 'text-slate-900'}`}>
                            {appt.time}
                          </p>
                        </div>
                        <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
                        <Avatar className="h-14 w-14 ring-4 ring-white shadow-sm shrink-0">
                          <AvatarImage src={appt.patientAvatar || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold text-lg">
                            {appt.patientName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate text-xl leading-tight">{appt.patientName}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tight h-6 px-3 border-none ${appt.type.includes('Vídeo') ? 'text-indigo-700 bg-indigo-100/50' : 'text-slate-600 bg-slate-100'
                              }`}>
                              {appt.type}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Activity className="h-3 w-3" />
                              {appt.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PrescriptionModal
                            doctor={doctor}
                            patients={patients}
                            initialPatientId={appt.patientId}
                            variant="compact"
                          />
                          {index === 0 && appt.type.includes('Vídeo') && (
                            <Link href={`/doctor/video-call?patient=${appt.patientId}`}>
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 font-bold rounded-xl px-5">
                                <Video className="h-4 w-4 mr-2" />
                                Iniciar
                              </Button>
                            </Link>
                          )}
                          <ArrowRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${index === 0 ? 'text-blue-400' : 'text-slate-300'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[260px] text-center">
                    <div className="bg-slate-50 p-5 rounded-full mb-4 ring-8 ring-slate-50/50">
                      <Calendar className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Nenhuma consulta agendada</h3>
                    <p className="text-sm text-slate-500 mt-1">Aproveite para revisar prontuários pendentes.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>


        {/* Recent Activity Feed */}
        <Card className="border-none ring-1 ring-slate-200 shadow-sm bg-white overflow-hidden rounded-3xl mb-12">
          <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                Centro de Atividade Recente
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Acompanhe as últimas interações e eventos clínicos
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-400 font-bold hover:text-slate-600">
              Limpar Registro
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-6 p-5 hover:bg-slate-50/50 transition-colors group cursor-default"
                  >
                    <div className={`p-3 rounded-2xl shrink-0 ${activity.type === 'prescription' ? 'bg-blue-50 text-blue-600' :
                      activity.type === 'exam' ? 'bg-amber-50 text-amber-600' :
                        'bg-violet-50 text-violet-600'
                      } group-hover:scale-110 transition-transform duration-300`}>
                      {activity.type === 'prescription' ? <FileText className="h-6 w-6" /> :
                        activity.type === 'exam' ? <ShieldAlert className="h-6 w-6" /> :
                          <Stethoscope className="h-6 w-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-extrabold text-slate-900 text-lg leading-none">{activity.title}</p>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(activity.timestamp.toISOString())}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {activity.patientName}
                        </span>
                        <span className="text-sm font-medium opacity-80">•</span>
                        <span className="text-sm font-medium">{activity.subtitle}</span>
                      </div>
                    </div>

                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white hover:border-blue-300 hover:text-blue-600 shadow-sm">
                        Detalhes <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="bg-slate-50 p-6 rounded-full inline-block mb-4 ring-8 ring-slate-50/30">
                    <Activity className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-900 font-bold">Nenhuma atividade recente</p>
                  <p className="text-sm text-slate-500">Seus registros clínicos aparecerão aqui conforme você atende pacientes.</p>
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50/30 border-t border-slate-50 text-center">
            <Link href="/doctor/history">
              <Button variant="link" className="text-blue-600 font-bold text-sm">
                Ver histórico completo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
