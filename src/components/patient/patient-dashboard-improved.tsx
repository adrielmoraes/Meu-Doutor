'use client';

import { FileClock, UserPlus, HeartPulse, Video, Activity, User, Upload, Brain, Calendar, TrendingUp, Award, Sparkles, MessageCircle, LayoutDashboard, FileText, Heart, Users, Apple, Dumbbell, BrainCircuit, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import type { Patient } from "@/types";
import { Badge } from "@/components/ui/badge";
import { PatientHeader } from './patient-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MediAILogo } from "./medi-ai-logo"; // Assuming MediAILogo is in a component file
import { useLiveKitWarmup } from '@/hooks/use-livekit-warmup';



interface PatientDashboardProps {
    patient: Patient;
    examCount?: number;
    upcomingAppointments?: number;
}

export default function PatientDashboardImproved({ patient, examCount = 0, upcomingAppointments = 0 }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Pre-load LiveKit connection for instant consultation start
  const { isWarming, isWarmed } = useLiveKitWarmup(patient.id ?? null, patient.name ?? null);

  const quickActions = [
    {
      title: "Fale com o Terapeuta",
      icon: <MessageCircle className="h-6 w-6 text-green-700 dark:text-green-400" />,
      href: "/patient/therapist-chat",
      description: "Chat com IA terapeuta e assistente pessoal 24/7",
      gradient: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      hoverBorder: "hover:border-green-500/60",
      hoverShadow: "hover:shadow-green-500/20",
    },
    {
      title: "Consulta ao Vivo com IA",
      icon: <Video className="h-6 w-6 text-purple-700 dark:text-purple-400" />,
      href: "/patient/live-consultation",
      description: "Consulta por vídeo com assistente inteligente em tempo real",
      gradient: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      hoverBorder: "hover:border-purple-500/60",
      hoverShadow: "hover:shadow-purple-500/20",
    },
    {
      title: "Upload de Exames",
      icon: <Upload className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />,
      href: "/patient/upload-exam",
      description: "Envie seus exames para análise imediata da IA",
      gradient: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
      hoverBorder: "hover:border-cyan-500/60",
      hoverShadow: "hover:shadow-cyan-500/20",
    },
    {
      title: "Médicos Disponíveis",
      icon: <UserPlus className="h-6 w-6 text-blue-700 dark:text-blue-400" />,
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
      icon: <FileClock className="h-6 w-6 text-amber-700 dark:text-amber-400" />,
      href: "/patient/history",
      description: "Acesse seus exames e análises anteriores",
      gradient: "from-amber-500/10 to-orange-500/10",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Plano de Bem-Estar",
      icon: <HeartPulse className="h-6 w-6 text-pink-700 dark:text-pink-400" />,
      href: "/patient/wellness",
      description: "Seu plano personalizado de saúde",
      gradient: "from-pink-500/10 to-rose-500/10",
      borderColor: "border-pink-500/30",
    },
    {
      title: "Monitoramento",
      icon: <Activity className="h-6 w-6 text-green-700 dark:text-green-400" />,
      href: "/patient/monitoring",
      description: "Dados dos seus wearables em tempo real",
      gradient: "from-green-500/10 to-emerald-500/10",
      borderColor: "border-green-500/30",
    },
    {
      title: "Meu Perfil",
      icon: <User className="h-6 w-6 text-indigo-700 dark:text-indigo-400" />,
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
      icon: <FileClock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      gradient: "from-cyan-500/20 to-blue-500/20 dark:from-cyan-500/10 dark:to-blue-500/10",
      borderColor: "border-cyan-500/40 dark:border-cyan-500/20",
    },
    {
      title: "Consultas Agendadas",
      value: upcomingAppointments.toString(),
      icon: <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      gradient: "from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10",
      borderColor: "border-purple-500/40 dark:border-purple-500/20",
    },
    {
      title: "Status de Saúde",
      value: patient.status === 'Validado' ? 'Ótimo' : 'Em Análise',
      icon: <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />,
      gradient: "from-green-500/20 to-emerald-500/20 dark:from-green-500/10 dark:to-emerald-500/10",
      borderColor: "border-green-500/40 dark:border-green-500/20",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-[#fce7f5] via-[#f9d5ed] to-[#fce7f5] dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 min-h-screen relative overflow-hidden">
      {/* Header with Menu */}
      <PatientHeader patient={patient} />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#f774c0]/15 via-transparent to-transparent dark:from-cyan-900/20"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-10 right-10 w-72 h-72 bg-[#f774c0]/15 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#e85bb5]/15 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Welcome Section */}
        <div className="mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">
              Portal do Paciente
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Olá, {patient.name.split(' ')[0]}!
          </h1>
          <p className="text-lg text-foreground/85 dark:text-muted-foreground max-w-2xl">
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
              <p className="text-foreground/80 dark:text-muted-foreground mt-2 max-w-2xl mx-auto">
                Tire suas dúvidas de saúde em tempo real com nosso assistente inteligente que conhece todo o seu histórico médico e pode orientá-lo sobre seus exames e tratamentos.
              </p>
            </div>

            <Card className="bg-card/50 dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-900/50 border-border backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-4">
                <Video className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground dark:text-card-foreground">Pronto para começar?</h3>
                <p className="text-foreground/80 dark:text-muted-foreground max-w-md mx-auto">
                  Clique no botão abaixo para iniciar sua consulta ao vivo com a MediAI. 
                  Você poderá conversar por voz e vídeo em tempo real.
                </p>
                <div className="space-y-2">
                  <Link href="/patient/live-consultation">
                    <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 w-full">
                      <Video className="mr-2 h-5 w-5" />
                      Iniciar Consulta ao Vivo
                      {isWarmed && <Zap className="ml-2 h-4 w-4 text-yellow-300" />}
                    </Button>
                  </Link>
                  {isWarmed ? (
                    <p className="text-sm text-emerald-400 font-medium flex items-center justify-center gap-1">
                      <Zap className="h-3 w-3" />
                      Conexão preparada – início instantâneo garantido
                    </p>
                  ) : isWarming ? (
                    <p className="text-sm text-blue-300/70 flex items-center justify-center gap-1">
                      Preparando conexão segura…
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Live Consultation Banner - Responsivo */}
            <Card className="text-white border-0 shadow-2xl overflow-hidden relative min-h-[320px] md:min-h-[400px] lg:min-h-[450px]">
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

              <CardContent className="p-6 md:p-8 lg:p-10 relative z-10">
                <div className="flex flex-col items-start gap-3 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-3 mb-1">
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold drop-shadow-2xl">Consulta ao Vivo com a IA</h3>
                    <Badge className="bg-white/30 text-white border-white/40 text-xs backdrop-blur-sm">NOVO</Badge>
                  </div>
                  <p className="text-white/90 text-sm md:text-base lg:text-lg drop-shadow-lg mb-2">
                    Atendimento médico personalizado 24/7 com acesso completo ao seu histórico
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs md:text-sm mb-4">
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
                  <div className="space-y-2">
                    <Link href="/patient/live-consultation">
                      <Button
                        size="lg"
                        className="bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-2xl hover:scale-105 transition-transform w-full"
                      >
                        <Video className="mr-2 h-5 w-5" />
                        Iniciar Consulta ao Vivo
                        {isWarmed && <Zap className="ml-2 h-4 w-4 text-purple-600" />}
                      </Button>
                    </Link>
                    {isWarmed && (
                      <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3" />
                        Início instantâneo pronto
                      </p>
                    )}
                  </div>
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
              <p className="text-foreground/80 dark:text-muted-foreground mt-2 max-w-2xl mx-auto">
                Acompanhe todos os seus exames e laudos de forma organizada e acessível.
              </p>
            </div>
            <Card className="bg-card/80 backdrop-blur-sm border-2 border-border">
              <CardContent className="p-8 text-center space-y-4">
                <FileClock className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground dark:text-card-foreground">Acesse seus exames</h3>
                <p className="text-foreground/80 dark:text-muted-foreground max-w-md mx-auto">
                  Visualize todos os exames que você enviou, suas análises da IA e acompanhe a evolução dos seus resultados ao longo do tempo.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Link href="/patient/history">
                    <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90">
                      <FileText className="mr-2 h-5 w-5" />
                      Ver Histórico Completo
                    </Button>
                  </Link>
                  <Link href="/patient/upload-exam">
                    <Button size="lg" variant="outline">
                      <Upload className="mr-2 h-5 w-5" />
                      Enviar Novo Exame
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wellness" className="space-y-6 mt-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                <HeartPulse className="h-8 w-8 text-pink-400" />
                Seu Plano de Bem-Estar
              </h2>
              <p className="text-foreground/80 dark:text-muted-foreground mt-2 max-w-2xl mx-auto">
                Descubra recomendações personalizadas para otimizar sua saúde e qualidade de vida.
              </p>
            </div>
            <Card className="bg-card/80 backdrop-blur-sm border-2 border-border">
              <CardContent className="p-8 text-center space-y-4">
                <HeartPulse className="h-16 w-16 text-pink-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground dark:text-card-foreground">Plano Personalizado de Saúde</h3>
                <p className="text-foreground/80 dark:text-muted-foreground max-w-md mx-auto">
                  Acesse seu plano de bem-estar criado pela IA Nutricionista com base nos seus exames. Inclui plano alimentar, exercícios, bem-estar mental e muito mais.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-4">
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Apple className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-xs font-medium">Alimentação</p>
                  </div>
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <Dumbbell className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                    <p className="text-xs font-medium">Exercícios</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <BrainCircuit className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs font-medium">Saúde Mental</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs font-medium">Rotina Semanal</p>
                  </div>
                </div>
                <Link href="/patient/wellness" className="inline-block mt-6">
                  <Button size="lg" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90">
                    <HeartPulse className="mr-2 h-5 w-5" />
                    Ver Meu Plano Completo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6 mt-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                <Calendar className="h-8 w-8 text-purple-400" />
                Suas Consultas
              </h2>
              <p className="text-foreground/80 dark:text-muted-foreground mt-2 max-w-2xl mx-auto">
                Visualize suas consultas futuras e passadas. Agende novos atendimentos com facilidade.
              </p>
            </div>
            <Card className="bg-card/80 backdrop-blur-sm border-2 border-border">
              <CardContent className="p-8 text-center space-y-4">
                <Calendar className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground dark:text-card-foreground">Gerencie suas consultas</h3>
                <p className="text-foreground/80 dark:text-muted-foreground max-w-md mx-auto">
                  {upcomingAppointments > 0 
                    ? `Você tem ${upcomingAppointments} ${upcomingAppointments === 1 ? 'consulta agendada' : 'consultas agendadas'}.`
                    : 'Você ainda não tem consultas agendadas. Conecte-se com nossos médicos especialistas!'}
                </p>
                <Link href="/patient/doctors" className="inline-block mt-6">
                  <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Agendar Consulta com Médico
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors" className="space-y-6 mt-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                <Users className="h-8 w-8 text-indigo-400" />
                Médicos da Rede
              </h2>
              <p className="text-foreground/80 dark:text-muted-foreground mt-2 max-w-2xl mx-auto">
                Conecte-se com profissionais qualificados em diversas especialidades.
              </p>
            </div>
            <Card className="bg-card/80 backdrop-blur-sm border-2 border-border">
              <CardContent className="p-8 text-center space-y-4">
                <Users className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground dark:text-card-foreground">Rede de Especialistas</h3>
                <p className="text-foreground/80 dark:text-muted-foreground max-w-md mx-auto">
                  Conecte-se com médicos humanos da nossa rede para validar diagnósticos, tirar dúvidas e agendar consultas por vídeo.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-md mx-auto">
                  <Badge variant="outline">Cardiologia</Badge>
                  <Badge variant="outline">Dermatologia</Badge>
                  <Badge variant="outline">Endocrinologia</Badge>
                  <Badge variant="outline">Ginecologia</Badge>
                  <Badge variant="outline">Neurologia</Badge>
                  <Badge variant="outline">Ortopedia</Badge>
                  <Badge variant="outline">Pediatria</Badge>
                  <Badge variant="outline">+10 especialidades</Badge>
                </div>
                <Link href="/patient/doctors" className="inline-block mt-6">
                  <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90">
                    <Users className="mr-2 h-5 w-5" />
                    Ver Médicos Disponíveis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 mt-8">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className={`bg-card/60 dark:bg-gradient-to-br dark:from-slate-800/60 dark:to-slate-900/60 backdrop-blur-xl border ${stat.borderColor} hover:scale-105 transition-transform duration-300`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/80 dark:text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-card-foreground">{stat.value}</p>
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
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className={`group relative bg-card/80 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl border ${action.borderColor} ${action.hoverBorder} transition-all duration-300 hover:shadow-2xl ${action.hoverShadow} overflow-hidden transform hover:scale-105`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-100 transition-opacity`}></div>

                <Link href={action.href} className="block h-full relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-lg font-bold ${action.icon.props.className.replace('h-6 w-6', '')}`}>
                      {action.title}
                    </CardTitle>
                    {action.icon}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 dark:text-muted-foreground">
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
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Seus Recursos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {navigationCards.map((card) => (
              <Card
                key={card.title}
                className={`group bg-card/60 dark:bg-gradient-to-br dark:from-slate-800/60 dark:to-slate-900/60 backdrop-blur-xl border ${card.borderColor} hover:border-primary/40 transition-all duration-300 hover:scale-105 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-100 transition-opacity`}></div>

                <Link href={card.href} className="block h-full relative">
                  <CardHeader className="space-y-3">
                    <div className="p-2 w-fit rounded-lg bg-primary/10">
                      {card.icon}
                    </div>
                    <CardTitle className={`text-base font-semibold ${card.icon.props.className.replace('h-6 w-6', '')}`}>
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-foreground/80 dark:text-muted-foreground">
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