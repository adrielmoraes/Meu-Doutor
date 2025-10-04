'use client';

import { FileClock, UserPlus, HeartPulse, Video, Activity, User, Upload, Brain, Calendar, TrendingUp, Award, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import type { Patient } from "@/types";
import { Badge } from "@/components/ui/badge";
import dynamic from 'next/dynamic';

const AIConsultationCard = dynamic(() => import('./ai-consultation-card'), { 
  ssr: false,
  loading: () => (
    <Card className="flex flex-col justify-between bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30">
      <CardContent className="pt-6 flex items-center justify-center h-64">
        <div className="text-purple-300 animate-pulse">Carregando consulta IA...</div>
      </CardContent>
    </Card>
  )
});

interface PatientDashboardProps {
    patient: Patient;
    examCount?: number;
    upcomingAppointments?: number;
}

export default function PatientDashboardImproved({ patient, examCount = 0, upcomingAppointments = 0 }: PatientDashboardProps) {
  const quickActions = [
    {
      title: "Upload de Exames",
      icon: <Upload className="h-6 w-6 text-cyan-400" />,
      href: "/patient/upload-exam",
      description: "Envie seus exames para análise imediata da IA",
      gradient: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
      hoverBorder: "hover:border-cyan-500/60",
      hoverShadow: "hover:shadow-cyan-500/20",
    },
    {
      title: "Médicos Disponíveis",
      icon: <UserPlus className="h-6 w-6 text-blue-400" />,
      href: "/patient/doctors",
      description: "Conecte-se com médicos da nossa rede",
      gradient: "from-blue-500/20 to-indigo-500/20",
      borderColor: "border-blue-500/30",
      hoverBorder: "hover:border-blue-500/60",
      hoverShadow: "hover:shadow-blue-500/20",
    },
  ];

  const navigationCards = [
    {
      title: "Histórico de Exames",
      icon: <FileClock className="h-6 w-6 text-amber-400" />,
      href: "/patient/history",
      description: "Acesse seus exames e análises anteriores",
      gradient: "from-amber-500/10 to-orange-500/10",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Plano de Bem-Estar",
      icon: <HeartPulse className="h-6 w-6 text-pink-400" />,
      href: "/patient/wellness",
      description: "Seu plano personalizado de saúde",
      gradient: "from-pink-500/10 to-rose-500/10",
      borderColor: "border-pink-500/30",
    },
    {
      title: "Monitoramento",
      icon: <Activity className="h-6 w-6 text-green-400" />,
      href: "/patient/monitoring",
      description: "Dados dos seus wearables em tempo real",
      gradient: "from-green-500/10 to-emerald-500/10",
      borderColor: "border-green-500/30",
    },
    {
      title: "Meu Perfil",
      icon: <User className="h-6 w-6 text-indigo-400" />,
      href: "/patient/profile",
      description: "Visualize e edite suas informações",
      gradient: "from-indigo-500/10 to-violet-500/10",
      borderColor: "border-indigo-500/30",
    },
  ];

  const stats = [
    {
      title: "Exames Analisados",
      value: examCount.toString(),
      icon: <FileClock className="h-5 w-5 text-cyan-400" />,
      gradient: "from-cyan-500/10 to-blue-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      title: "Consultas Agendadas",
      value: upcomingAppointments.toString(),
      icon: <Calendar className="h-5 w-5 text-purple-400" />,
      gradient: "from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      title: "Status de Saúde",
      value: patient.status === 'Validado' ? 'Ótimo' : 'Em Análise',
      icon: <TrendingUp className="h-5 w-5 text-green-400" />,
      gradient: "from-green-500/10 to-emerald-500/10",
      borderColor: "border-green-500/20",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Welcome Section */}
        <div className="mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Portal do Paciente</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
            Olá, {patient.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-lg text-blue-200/70 max-w-2xl">
            Sua saúde em primeiro lugar. Acompanhe seus exames, consulte especialistas e mantenha seu bem-estar com nossa tecnologia de IA avançada.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border ${stat.borderColor} hover:scale-105 transition-transform duration-300`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Consultation - Featured Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-7 w-7 text-purple-400" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              Consulta com IA em Tempo Real
            </h2>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Novo
            </Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AIConsultationCard />
            </div>
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Sobre a Consulta IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-blue-200/70">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
                    <p>Avatar 3D realista com sincronização labial em português</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
                    <p>Reconhecimento de voz em tempo real</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0"></div>
                    <p>Análise médica com 15+ especialistas IA</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                    <p>Respostas contextualizadas com seus exames</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className={`group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border ${action.borderColor} ${action.hoverBorder} transition-all duration-300 hover:shadow-2xl ${action.hoverShadow} overflow-hidden transform hover:scale-105`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                <Link href={action.href} className="block h-full relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold text-cyan-300">
                      {action.title}
                    </CardTitle>
                    {action.icon}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-200/70">
                      {action.description}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Navigation Cards */}
        <div>
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Seus Recursos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {navigationCards.map((card) => (
              <Card
                key={card.title}
                className={`group bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border ${card.borderColor} hover:border-cyan-500/40 transition-all duration-300 hover:scale-105 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                <Link href={card.href} className="block h-full relative">
                  <CardHeader className="space-y-3">
                    <div className="p-2 w-fit rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                      {card.icon}
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-100">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-400">
                      {card.description}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
