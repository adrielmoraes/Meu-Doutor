'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, History, Sparkles, Activity, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { OnlineStatusToggle } from "@/components/doctor/online-status-toggle";
import type { Doctor } from "@/types";
import MediAILogo from "@/components/layout/mediai-logo";

interface DoctorDashboardImprovedProps {
  doctor: Doctor;
  totalPatients: number;
  upcomingAppointments: number;
  completedConsultations: number;
}

export default function DoctorDashboardImproved({
  doctor,
  totalPatients,
  upcomingAppointments,
  completedConsultations
}: DoctorDashboardImprovedProps) {

    const stats = [
      {
        title: "Total de Pacientes",
        value: totalPatients,
        icon: <Users className="h-6 w-6 text-cyan-400" />,
        gradient: "from-cyan-500/20 to-blue-500/20",
        borderColor: "border-cyan-500/30",
        textColor: "text-cyan-300"
      },
      {
        title: "Consultas Agendadas",
        value: upcomingAppointments,
        icon: <Clock className="h-6 w-6 text-purple-400" />,
        gradient: "from-purple-500/20 to-pink-500/20",
        borderColor: "border-purple-500/30",
        textColor: "text-purple-300"
      },
      {
        title: "Consultas Realizadas",
        value: completedConsultations,
        icon: <TrendingUp className="h-6 w-6 text-green-400" />,
        gradient: "from-green-500/20 to-emerald-500/20",
        borderColor: "border-green-500/30",
        textColor: "text-green-300"
      }
    ];

    const navigationCards = [
    {
      title: "Meus Pacientes",
      icon: <Users className="h-8 w-8 text-cyan-400" />,
      href: "/doctor/patients",
      description: "Veja e gerencie a lista de seus pacientes.",
      gradient: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
      hoverBorder: "hover:border-cyan-500/50",
      hoverShadow: "hover:shadow-cyan-500/20"
    },
    {
      title: "Consultas e Agendamentos",
      icon: <Calendar className="h-8 w-8 text-purple-400" />,
      href: "/doctor/schedule",
      description: "Acesse sua agenda e consultas virtuais.",
      gradient: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      hoverBorder: "hover:border-purple-500/50",
      hoverShadow: "hover:shadow-purple-500/20"
    },
    {
      title: "Histórico de Atendimentos",
      icon: <History className="h-8 w-8 text-blue-400" />,
      href: "/doctor/history",
      description: "Revise seus atendimentos e diagnósticos passados.",
      gradient: "from-blue-500/20 to-indigo-500/20",
      borderColor: "border-blue-500/30",
      hoverBorder: "hover:border-blue-500/50",
      hoverShadow: "hover:shadow-blue-500/20"
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-cyan-300 font-medium">Portal do Médico</span>
            </div>
            <MediAILogo className="h-12 w-auto" />
          </div>


          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Bem-vindo, Dr. {doctor.name.split(' ')[0]}
          </h1>
          <p className="text-lg text-blue-200/70">
            Gerencie seus pacientes, agenda e histórico de forma eficiente.
          </p>

          {/* Status Online/Offline Toggle */}
          <div className="max-w-md">
            <OnlineStatusToggle initialStatus={doctor.online || false} doctorName={doctor.name} />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={stat.title}
              className={`group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border ${stat.borderColor} hover:border-opacity-70 transition-all duration-300 hover:shadow-2xl overflow-hidden`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-200/80">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent className="relative">
                <div className={`text-4xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-blue-200/60 mt-1">
                  Atualizado agora
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map(card => (
            <Card
              key={card.title}
              className={`group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border ${card.borderColor} ${card.hoverBorder} transition-all duration-300 hover:shadow-2xl ${card.hoverShadow} overflow-hidden transform hover:scale-105`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

              <Link href={card.href} className="block h-full relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold text-cyan-300">
                    {card.title}
                  </CardTitle>
                  {card.icon}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-200/70">
                    {card.description}
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}