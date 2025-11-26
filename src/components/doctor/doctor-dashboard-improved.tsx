'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, Calendar, History, Sparkles, Activity, TrendingUp, Clock, 
  AlertTriangle, FileWarning, Search, Video, ArrowRight, 
  Timer, CheckCircle, BarChart3, Zap, Bell, Heart
} from "lucide-react";
import Link from "next/link";
import { OnlineStatusToggle } from "@/components/doctor/online-status-toggle";
import type { Doctor } from "@/types";
import MediAILogo from "@/components/layout/mediai-logo";

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
  weeklyConsultations
}: DoctorDashboardImprovedProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    {
      title: "Total de Pacientes",
      value: totalPatients,
      icon: <Users className="h-5 w-5 text-cyan-400" />,
      gradient: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
      textColor: "text-cyan-300"
    },
    {
      title: "Consultas Agendadas",
      value: upcomingAppointments,
      icon: <Clock className="h-5 w-5 text-purple-400" />,
      gradient: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      textColor: "text-purple-300"
    },
    {
      title: "Consultas Realizadas",
      value: completedConsultations,
      icon: <TrendingUp className="h-5 w-5 text-green-400" />,
      gradient: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      textColor: "text-green-300"
    },
    {
      title: "Exames Pendentes",
      value: pendingExamsCount,
      icon: <FileWarning className="h-5 w-5 text-amber-400" />,
      gradient: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
      textColor: "text-amber-300",
      alert: pendingExamsCount > 0
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Crítica': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'Alta': return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'Média': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default: return 'bg-green-500/20 text-green-300 border-green-500/50';
    }
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
    <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-cyan-300 font-medium">Portal do Médico</span>
            </div>
            <MediAILogo className="h-10 w-auto" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Bem-vindo, Dr. {doctor.name.split(' ')[0]}
              </h1>
              <p className="text-base text-blue-200/70 mt-1">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <OnlineStatusToggle initialStatus={doctor.online || false} doctorName={doctor.name} />
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/50" />
            <Input
              type="text"
              placeholder="Buscar paciente por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-blue-300/50 focus:border-cyan-500/50"
            />
            {searchQuery && (
              <Link 
                href={`/doctor/patients?search=${encodeURIComponent(searchQuery)}`}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card
              key={stat.title}
              className={`group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border ${stat.borderColor} hover:border-opacity-70 transition-all duration-300 overflow-hidden ${stat.alert ? 'animate-pulse-subtle' : ''}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-200/70">{stat.title}</span>
                  {stat.icon}
                </div>
                <div className={`text-2xl md:text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {urgentCases.length > 0 && (
            <Card className="lg:col-span-1 bg-gradient-to-br from-red-900/30 to-slate-900/80 backdrop-blur-xl border-red-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-300">
                  <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
                  Casos Urgentes
                </CardTitle>
                <CardDescription className="text-red-200/60">
                  Pacientes que requerem atenção imediata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-3">
                    {urgentCases.map((patient) => (
                      <Link 
                        key={patient.id} 
                        href={`/doctor/patients/${patient.id}`}
                        className="block"
                      >
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-red-500/20 hover:border-red-500/40">
                          <Avatar className="h-10 w-10 border-2 border-red-500/50">
                            <AvatarImage src={patient.avatar} />
                            <AvatarFallback className="bg-red-900/50 text-red-200">
                              {patient.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{patient.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${getPriorityColor(patient.priority)}`}>
                                {patient.priority}
                              </Badge>
                              {patient.pendingExams > 0 && (
                                <span className="text-xs text-amber-300">
                                  {patient.pendingExams} exame(s)
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-red-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <Card className={`${urgentCases.length > 0 ? 'lg:col-span-1' : 'lg:col-span-2'} bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-purple-500/30`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <Calendar className="h-5 w-5 text-purple-400" />
                Consultas de Hoje
              </CardTitle>
              <CardDescription className="text-purple-200/60">
                {todayAppointments.length} consulta(s) agendada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                {todayAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {todayAppointments.map((appt, index) => (
                      <div 
                        key={appt.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          index === 0 
                            ? 'bg-purple-500/20 border border-purple-500/40' 
                            : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                        }`}
                      >
                        <div className="text-center min-w-[50px]">
                          <p className={`text-lg font-bold ${index === 0 ? 'text-purple-300' : 'text-white'}`}>
                            {appt.time}
                          </p>
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={appt.patientAvatar || ''} />
                          <AvatarFallback className="bg-purple-900/50 text-purple-200">
                            {appt.patientName.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{appt.patientName}</p>
                          <p className="text-xs text-blue-200/60">{appt.type}</p>
                        </div>
                        {index === 0 && appt.type.includes('Vídeo') && (
                          <Link href={`/doctor/video-call?patient=${appt.patientId}`}>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                              <Video className="h-4 w-4 mr-1" />
                              Iniciar
                            </Button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <Calendar className="h-12 w-12 text-purple-400/30 mb-3" />
                    <p className="text-blue-200/60">Nenhuma consulta agendada para hoje</p>
                    <Link href="/doctor/schedule" className="mt-2">
                      <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300">
                        Ver Agenda
                      </Button>
                    </Link>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-300">
                <FileWarning className="h-5 w-5 text-amber-400" />
                Exames Pendentes
              </CardTitle>
              <CardDescription className="text-amber-200/60">
                {pendingExamsCount} exame(s) aguardando validação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                {pendingExams.length > 0 ? (
                  <div className="space-y-3">
                    {pendingExams.map((exam) => (
                      <Link 
                        key={exam.id} 
                        href={`/doctor/patients/${exam.patientId}`}
                        className="block"
                      >
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-amber-500/20 hover:border-amber-500/40">
                          <div className="p-2 rounded-lg bg-amber-500/20">
                            <FileWarning className="h-4 w-4 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{exam.type}</p>
                            <p className="text-xs text-blue-200/60">{exam.patientName}</p>
                          </div>
                          <span className="text-xs text-amber-300/70">
                            {getTimeAgo(exam.createdAt.toISOString())}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400/30 mb-3" />
                    <p className="text-blue-200/60">Todos os exames foram validados</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-blue-200/60">Consultas esta semana</p>
                  <p className="text-2xl font-bold text-blue-300">{weeklyConsultations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-500/20">
                  <Timer className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-blue-200/60">Validações</p>
                  <p className="text-2xl font-bold text-green-300">{doctor.validations || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-pink-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-pink-500/20">
                  <Zap className="h-5 w-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-xs text-blue-200/60">Nível</p>
                  <p className="text-2xl font-bold text-pink-300">{doctor.level || 1}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                  style={{ width: `${((doctor.xp || 0) / (doctor.xpToNextLevel || 100)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-blue-200/40 mt-1">
                {doctor.xp || 0} / {doctor.xpToNextLevel || 100} XP
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-cyan-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/20">
                  <Heart className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-blue-200/60">Pacientes atendidos</p>
                  <p className="text-2xl font-bold text-cyan-300">{totalPatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-hidden transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Link href="/doctor/patients" className="block h-full relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-cyan-300">Meus Pacientes</CardTitle>
                <Users className="h-8 w-8 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-200/70">
                  Veja e gerencie a lista de seus pacientes.
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Link href="/doctor/schedule" className="block h-full relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-purple-300">Consultas e Agenda</CardTitle>
                <Calendar className="h-8 w-8 text-purple-400" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-200/70">
                  Acesse sua agenda e consultas virtuais.
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Link href="/doctor/history" className="block h-full relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-blue-300">Histórico</CardTitle>
                <History className="h-8 w-8 text-blue-400" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-200/70">
                  Revise seus atendimentos e diagnósticos passados.
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
