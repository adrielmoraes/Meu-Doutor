'use client';

import { FileClock, UserPlus, HeartPulse, Video, Activity, User, Upload, Brain, Calendar, TrendingUp, Award, Sparkles, MessageCircle, LayoutDashboard, FileText, Heart, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import type { Patient } from "@/types";
import { Badge } from "@/components/ui/badge";
import { PatientHeader } from './patient-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Button } from "@/components/ui/button";




interface PatientDashboardProps {
    patient: Patient;
    examCount?: number;
    upcomingAppointments?: number;
}

export default function PatientDashboardImproved({ patient, examCount = 0, upcomingAppointments = 0 }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const quickActions = [
    {
      title: "Fale com o Terapeuta",
      icon: <MessageCircle className="h-6 w-6 text-green-400" />,
      href: "/patient/therapist-chat",
      description: "Chat com IA terapeuta e assistente pessoal 24/7",
      gradient: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      hoverBorder: "hover:border-green-500/60",
      hoverShadow: "hover:shadow-green-500/20",
    },
    {
      title: "Consulta ao Vivo com IA",
      icon: <Video className="h-6 w-6 text-purple-400" />,
      href: "/patient/live-consultation",
      description: "Consulta por vídeo com assistente inteligente em tempo real",
      gradient: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      hoverBorder: "hover:border-purple-500/60",
      hoverShadow: "hover:shadow-purple-500/20",
    },
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
      title: "Assinatura",
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      href: "/patient/subscription",
      description: "Gerencie sua assinatura e planos",
      gradient: "from-yellow-500/10 to-amber-500/10",
      borderColor: "border-yellow-500/30",
    },
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
      {/* Header with Menu */}
      <PatientHeader patient={patient} />

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

        {/* Tabs for Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="live-consultation" className="flex items-center gap-2 relative">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Consulta ao Vivo</span>
              <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-1">NOVO</Badge>
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Exames</span>
            </TabsTrigger>
            <TabsTrigger value="wellness" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Bem-estar</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Consultas</span>
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Médicos</span>
            </TabsTrigger>
          </TabsList>

          {/* Live Consultation Tab - NOVO */}
          <TabsContent value="live-consultation" className="space-y-6 mt-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                <Video className="h-8 w-8 text-primary" />
                Consulta ao Vivo com a IA
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Tire suas dúvidas de saúde em tempo real com nosso assistente inteligente que conhece todo o seu histórico médico e pode orientá-lo sobre seus exames e tratamentos.
              </p>
            </div>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
              <CardContent className="p-8 text-center space-y-4">
                <Video className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white">Pronto para começar?</h3>
                <p className="text-slate-300 max-w-md mx-auto">
                  Clique no botão abaixo para iniciar sua consulta ao vivo com a MediAI. 
                  Você poderá conversar por voz e vídeo em tempo real.
                </p>
                <Link href="/patient/live-consultation">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Video className="mr-2 h-5 w-5" />
                    Iniciar Consulta ao Vivo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Live Consultation Banner - Restaurado */}
            <Card className="text-white border-0 shadow-2xl overflow-hidden relative min-h-[280px]">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/ai-assistant-video.mp4" type="video/mp4" />
              </video>
              
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-purple-900/40" />
              
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col items-start gap-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-4xl md:text-5xl font-bold drop-shadow-2xl">Consulta ao Vivo com a IA</h3>
                    <Badge className="bg-white/30 text-white border-white/40 text-xs backdrop-blur-sm">NOVO</Badge>
                  </div>
                  <p className="text-white/90 text-base drop-shadow-lg mb-2">
                    Atendimento médico personalizado 24/7 com acesso completo ao seu histórico
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm mb-4">
                    <span className="flex items-center gap-1 bg-white/25 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <Brain className="h-4 w-4" /> Conhece seus exames
                    </span>
                    <span className="flex items-center gap-1 bg-white/25 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <HeartPulse className="h-4 w-4" /> Orientação personalizada
                    </span>
                    <span className="flex items-center gap-1 bg-white/25 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <Activity className="h-4 w-4" /> Disponível sempre
                    </span>
                  </div>
                  <Link href="/patient/live-consultation">
                    <Button
                      size="lg"
                      className="bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-2xl hover:scale-105 transition-transform"
                    >
                      <Video className="mr-2 h-5 w-5" />
                      Iniciar Consulta ao Vivo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exams" className="space-y-6 mt-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-amber-400" />
                Histórico de Exames
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Acompanhe todos os seus exames e laudos de forma organizada e acessível.
              </p>
            </div>
            {/* Placeholder for Exam History */}
            <Card className="p-8">
              <p className="text-center text-muted-foreground">Seu histórico de exames será exibido aqui.</p>
            </Card>
          </TabsContent>

          <TabsContent value="wellness" className="space-y-6 mt-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                <HeartPulse className="h-8 w-8 text-pink-400" />
                Seu Plano de Bem-Estar
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Descubra recomendações personalizadas para otimizar sua saúde e qualidade de vida.
              </p>
            </div>
            {/* Placeholder for Wellness Plan */}
            <Card className="p-8">
              <p className="text-center text-muted-foreground">Seu plano de bem-estar será exibido aqui.</p>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6 mt-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                <Calendar className="h-8 w-8 text-purple-400" />
                Suas Consultas
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Visualize suas consultas futuras e passadas. Agende novos atendimentos com facilidade.
              </p>
            </div>
            {/* Placeholder for Appointments */}
            <Card className="p-8">
              <p className="text-center text-muted-foreground">Suas consultas serão exibidas aqui.</p>
            </Card>
          </TabsContent>

          <TabsContent value="doctors" className="space-y-6 mt-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                <Users className="h-8 w-8 text-indigo-400" />
                Médicos da Rede
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Conecte-se com profissionais qualificados em diversas especialidades.
              </p>
            </div>
            {/* Placeholder for Doctors */}
            <Card className="p-8">
              <p className="text-center text-muted-foreground">Nossos médicos parceiros serão listados aqui.</p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 mt-8">
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

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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