"use client";

import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import Image from "next/image";
import {
  Stethoscope,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Lock,
  Brain,
  Activity,
  HeartPulse,
  Check,
  Upload,
  Video,
  MessageSquare,
  Star,
  CheckCircle2,
  Clock,
  Users,
  Play,
  Mic,
  Camera,
  Cpu,
  Dna,
  Pill,
  Microscope,
  Scan,
  Waves,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [videoStarted, setVideoStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsTransitioning(true);

    setTimeout(() => {
      setVideoStarted(true);
      if (iframeRef.current) {
        iframeRef.current.focus();
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      async function checkAuth() {
        try {
          const res = await fetch("/api/session", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            if (data.session && data.session.role) {
              const dashboardUrl =
                data.session.role === "patient"
                  ? "/patient/dashboard"
                  : "/doctor";
              router.replace(dashboardUrl);
            }
          }
        } catch (e) {
        }
      }
      checkAuth();

      const handleScroll = () => setScrollY(window.scrollY);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-x-hidden">
      <Header />
      <main className="flex-1">
        {/* Hero Section - Ultra Futuristic */}
        <section className="relative w-full min-h-screen flex items-center overflow-hidden">
          {/* Realistic Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/futuristic_medical_tech_background.png')" }}
          ></div>
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50"></div>

          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
            <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-300"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping delay-500"></div>
            <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-cyan-300 rounded-full animate-ping delay-700"></div>
          </div>

          {/* Glowing Orbs */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-[120px] animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse delay-500"></div>

          <div className="container px-4 md:px-6 relative z-10 py-16">
            <div className="flex flex-col items-center text-center space-y-10">
              {/* Header Content */}
              <div className="space-y-6 max-w-4xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">Tecnologia de Ponta em Saúde</span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl leading-tight">
                  <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
                    O Futuro da
                  </span>
                  {" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                    Saúde Está Aqui
                  </span>
                </h1>

                <p className="max-w-[700px] mx-auto text-lg text-blue-100/80 leading-relaxed">
                  Diagnósticos instantâneos com IA de última geração. Consultas em tempo real com avatar médico inteligente. Sua saúde revolucionada.
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-cyan-300">25+ Especialistas de Elite</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                    <Video className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-purple-300">Consultas por Vídeo</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300">100% Seguro</span>
                  </div>
                </div>
              </div>

              {/* Hero VSL Video - Centered */}
              <div id="demo" className="relative w-full max-w-4xl mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-3xl blur-3xl transform rotate-1"></div>
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 bg-slate-900/50 backdrop-blur-sm">
                    <div className="aspect-video relative">
                      {/* Video Iframe - YouTube com autoplay */}
                      <iframe
                        ref={iframeRef}
                        src={videoStarted
                          ? "https://www.youtube.com/embed/8YTSeJI2_pc?autoplay=1&rel=0&modestbranding=1"
                          : "https://www.youtube.com/embed/8YTSeJI2_pc?rel=0&modestbranding=1"
                        }
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        title="MediAI - Inteligência Artificial a Serviço da Sua Saúde"
                      ></iframe>

                      {/* Animated Play Overlay */}
                      {!videoStarted && (
                        <div
                          onClick={handlePlayClick}
                          className={`absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-950/90 to-slate-900/95 cursor-pointer flex flex-col items-center justify-center gap-6 transition-all duration-300 hover:from-slate-900/90 hover:via-blue-950/85 hover:to-slate-900/90 group/overlay ${isTransitioning ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        >
                          {/* Animated Background Rings */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-cyan-500/20 animate-ping"></div>
                            <div className="absolute w-40 h-40 md:w-56 md:h-56 rounded-full border border-purple-500/10 animate-pulse"></div>
                            <div className="absolute w-48 h-48 md:w-64 md:h-64 rounded-full border border-blue-500/10 animate-pulse delay-300"></div>
                          </div>

                          {/* Play Button */}
                          <div className="relative z-10">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50 transform group-hover/overlay:scale-110 transition-all duration-300">
                              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 opacity-80"></div>
                              <Play className="relative z-10 h-8 w-8 md:h-12 md:w-12 text-white fill-white ml-1" />
                            </div>
                          </div>

                          {/* Text */}
                          <div className="relative z-10 text-center space-y-2">
                            <p className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent animate-pulse">
                              Clique para Assistir
                            </p>
                            <p className="text-sm md:text-base text-blue-200/70">
                              Descubra como a IA pode transformar sua saúde
                            </p>
                          </div>

                          {/* Floating Icons */}
                          <div className="absolute top-8 left-8 text-cyan-400/40 animate-bounce">
                            <Stethoscope className="h-6 w-6 md:h-8 md:w-8" />
                          </div>
                          <div className="absolute top-8 right-8 text-purple-400/40 animate-bounce delay-300">
                            <Brain className="h-6 w-6 md:h-8 md:w-8" />
                          </div>
                          <div className="absolute bottom-8 left-8 text-blue-400/40 animate-bounce delay-500">
                            <HeartPulse className="h-6 w-6 md:h-8 md:w-8" />
                          </div>
                          <div className="absolute bottom-8 right-8 text-emerald-400/40 animate-bounce delay-700">
                            <Activity className="h-6 w-6 md:h-8 md:w-8" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Decorative Corner Elements */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-500/50 rounded-tl-2xl pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-purple-500/50 rounded-tr-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-purple-500/50 rounded-bl-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-cyan-500/50 rounded-br-2xl pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg px-8 rounded-2xl shadow-2xl shadow-cyan-500/30 transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/50 group"
                >
                  <Link href="/register" className="flex items-center gap-3">
                    Começar Gratuitamente
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg px-8 rounded-2xl shadow-2xl shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/50 group"
                >
                  <Link href="/register" className="flex items-center gap-3">
                    <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Criar Conta Grátis
                  </Link>
                </Button>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center gap-8 pt-6 border-t border-cyan-500/20 w-full max-w-2xl relative z-20">
                <div className="space-y-1 text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">25+</div>
                  <div className="text-sm text-blue-200/70">Especialistas IA</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">24/7</div>
                  <div className="text-sm text-blue-200/70">Disponibilidade</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">99.9%</div>
                  <div className="text-sm text-blue-200/70">Precisão</div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator - hidden on smaller screens to avoid overlapping stats */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-cyan-400/50 z-0 hidden xl:flex">
            <span className="text-xs uppercase tracking-wider">Role para explorar</span>
            <div className="w-6 h-10 rounded-full border-2 border-cyan-400/30 flex items-start justify-center p-1">
              <div className="w-1.5 h-3 bg-cyan-400/50 rounded-full animate-bounce"></div>
            </div>
          </div>
        </section>

        {/* AI Doctor Section */}
        <section className="relative w-full py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950/50 to-slate-900"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* AI Doctor Video */}
              <div className="relative order-2 lg:order-1">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-3xl blur-[80px]"></div>
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 bg-slate-900/50 backdrop-blur-sm">
                    <div className="aspect-video">
                      <video
                        src="/Presence.MP4"
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls
                      />
                    </div>

                    {/* Decorative Corner Elements */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-500/50 rounded-tl-2xl pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-purple-500/50 rounded-tr-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-purple-500/50 rounded-bl-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-cyan-500/50 rounded-br-2xl pointer-events-none"></div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-3 shadow-lg shadow-cyan-500/30 animate-bounce z-10">
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-3 shadow-lg shadow-purple-500/30 animate-bounce delay-300 z-10">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute top-1/2 -right-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-3 shadow-lg shadow-emerald-500/30 animate-bounce delay-500 z-10">
                    <HeartPulse className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-8 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Video className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">Consultas ao Vivo com IA</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold">
                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    Conheça a sua
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Assistente Médica
                  </span>
                </h2>

                <p className="text-xl text-blue-100/80 leading-relaxed">
                  Converse por voz e vídeo, mostre sintomas pela câmera e receba diagnósticos instantâneos.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Mic className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-cyan-300">Conversa Natural por Voz</h4>
                      <p className="text-blue-200/70">Fale naturalmente em português. A IA entende e responde em tempo real.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Camera className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-purple-300">Visão por Câmera</h4>
                      <p className="text-blue-200/70">Mostre sintomas visuais. A IA analisa manchas, inchaços e alterações.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Cpu className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-emerald-300">25+ Especialidades</h4>
                      <p className="text-blue-200/70">Cardiologia, oncologia, genética e mais 20 áreas médicas.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Neural Network Section */}
        <section id="demo" className="relative w-full py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/ai_brain_neural_network_medical.png"
              alt="Rede neural de IA médica"
              fill
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950"></div>
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 mx-auto">
                <Brain className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Tecnologia Revolucionária</span>
              </div>

              <h2 className="text-4xl md:text-6xl font-bold">
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Recursos Revolucionários
                </span>
              </h2>

              <p className="text-xl text-blue-200/70 max-w-3xl mx-auto">
                Inteligência artificial de última geração trabalhando para sua saúde
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {/* Feature Cards */}
              <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors"></div>
                <div className="relative space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <Zap className="h-8 w-8 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Diagnóstico Instantâneo</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Upload de exames com análise por mais de 25 especialistas IA em segundos.
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>
                <div className="relative space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <Stethoscope className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Consultas ao Vivo</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Converse por voz e vídeo com IA médica avançada em tempo real.
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors"></div>
                <div className="relative space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">100% Seguro</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Criptografia end-to-end e conformidade total com LGPD.
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors"></div>
                <div className="relative space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <Dna className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Análise Genética</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Rastreamento de câncer e riscos hereditários com precisão molecular.
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-orange-500/20 hover:border-orange-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors"></div>
                <div className="relative space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <Pill className="h-8 w-8 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Medicamentos</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Recomendações de tratamento com dosagens e interações.
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-pink-500/20 hover:border-pink-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/20 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-colors"></div>
                <div className="relative space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <HeartPulse className="h-8 w-8 text-pink-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Bem-Estar Total</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Alta performance esportiva, recuperação muscular e longevidade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative w-full py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Como Funciona
              </h2>
              <p className="text-xl text-blue-200/70 max-w-3xl mx-auto">
                Três passos simples para revolucionar seu cuidado com a saúde
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center text-3xl font-bold shadow-2xl shadow-cyan-500/50 z-10">
                  1
                </div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 pt-16 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-6">
                    <Upload className="h-8 w-8 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Envie seus Exames</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Upload de documentos médicos, exames de sangue, imagens ou relatórios. Suporte para PDF, JPG, PNG.
                  </p>
                </div>
              </div>

              <div className="relative mt-8 md:mt-0">
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center text-3xl font-bold shadow-2xl shadow-purple-500/50 z-10">
                  2
                </div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 pt-16 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                    <Brain className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">IA Analisa</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    25+ especialistas IA examinam simultaneamente: oncologista, cardiologista, geneticista e mais.
                  </p>
                </div>
              </div>

              <div className="relative mt-8 md:mt-0">
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center text-3xl font-bold shadow-2xl shadow-emerald-500/50 z-10">
                  3
                </div>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 pt-16 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-6">
                    <Video className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Consulta ao Vivo</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Converse com IA médica por voz e vídeo. Receba diagnóstico detalhado e plano de tratamento.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Consultation Preview */}
            <div className="mt-20 max-w-5xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden border border-cyan-500/20 shadow-2xl">
                <Image
                  src="/images/telemedicine_video_call_interface.png"
                  alt="Interface de telemedicina futurista"
                  width={1200}
                  height={675}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>

                {/* Overlay Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/30">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Consulta ao Vivo</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div className="flex-1 bg-cyan-500/10 rounded-2xl rounded-tl-none p-4 border border-cyan-500/20">
                        <p className="text-blue-100">
                          "Olá! Sou a Dra. Sofia, sua assistente médica IA. Analisei seus exames e identifiquei alguns pontos importantes para discutirmos..."
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-200/50 mt-4">
                      <Clock className="h-4 w-4" />
                      <span>Resposta em tempo real</span>
                      <span className="mx-2">•</span>
                      <span>Disponível 24/7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative w-full py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/30 to-transparent"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                O Que Nossos Pacientes Dizem
              </h2>
              <div className="flex items-center justify-center gap-1 text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-7 w-7 fill-current drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                ))}
                <span className="ml-3 text-blue-200/70 text-lg">
                  4.9/5 de 2.500+ avaliações
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1">
                <div className="flex items-center gap-1 text-yellow-400 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-blue-100 mb-6 leading-relaxed text-lg">
                  "Incrível! Recebi meu diagnóstico preliminar em minutos. A análise foi tão detalhada que meu médico ficou impressionado."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-cyan-500/30">
                    MC
                  </div>
                  <div>
                    <div className="font-bold text-cyan-300 text-lg">Maria Clara</div>
                    <div className="text-sm text-blue-200/60">Paciente desde Jan 2025</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1">
                <div className="flex items-center gap-1 text-yellow-400 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-blue-100 mb-6 leading-relaxed text-lg">
                  "A consulta por vídeo com a IA é surpreendentemente natural. Tirei todas minhas dúvidas e recebi um plano personalizado."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/30">
                    RS
                  </div>
                  <div>
                    <div className="font-bold text-purple-300 text-lg">Roberto Silva</div>
                    <div className="text-sm text-blue-200/60">Paciente desde Dez 2024</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1">
                <div className="flex items-center gap-1 text-yellow-400 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-blue-100 mb-6 leading-relaxed text-lg">
                  "Como médica, fiquei impressionada com a profundidade da análise. Ferramenta poderosa para triagem."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-500/30">
                    AP
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300 text-lg">Dra. Ana Paula</div>
                    <div className="text-sm text-blue-200/60">Cardiologista</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative w-full py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950"></div>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>

          {/* Glowing Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="text-center space-y-3 p-6 rounded-3xl bg-slate-800/30 backdrop-blur-sm border border-cyan-500/10 hover:border-cyan-500/30 transition-colors">
                <div className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                  2.5K+
                </div>
                <div className="text-blue-200/70 font-medium text-lg">Pacientes Ativos</div>
              </div>
              <div className="text-center space-y-3 p-6 rounded-3xl bg-slate-800/30 backdrop-blur-sm border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                <div className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                  10K+
                </div>
                <div className="text-blue-200/70 font-medium text-lg">Exames Analisados</div>
              </div>
              <div className="text-center space-y-3 p-6 rounded-3xl bg-slate-800/30 backdrop-blur-sm border border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
                <div className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                  99.9%
                </div>
                <div className="text-blue-200/70 font-medium text-lg">Satisfação</div>
              </div>
              <div className="text-center space-y-3 p-6 rounded-3xl bg-slate-800/30 backdrop-blur-sm border border-orange-500/10 hover:border-orange-500/30 transition-colors">
                <div className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,146,60,0.4)]">
                  24/7
                </div>
                <div className="text-blue-200/70 font-medium text-lg">Disponibilidade</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative w-full py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/50 via-blue-950/50 to-purple-950/50"></div>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>

          {/* Animated Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">Oferta Especial</span>
              </div>

              <h2 className="text-4xl md:text-6xl font-bold">
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Experimente Gratuitamente
                </span>
                <br />
                <span className="text-white">por 7 Dias</span>
              </h2>

              <p className="text-xl text-blue-200/70 max-w-2xl mx-auto">
                Teste todos os recursos premium sem compromisso. Cancele quando quiser. Sem necessidade de cartão de crédito.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button
                  asChild
                  size="lg"
                  className="h-16 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xl px-12 rounded-2xl shadow-2xl shadow-cyan-500/40 transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/60"
                >
                  <Link href="/register" className="flex items-center gap-3">
                    Começar Teste Grátis
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-16 border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 font-semibold text-xl px-12 rounded-2xl backdrop-blur-sm"
                >
                  <Link href="/pricing">Ver Planos e Preços</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-blue-200/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Cancele a qualquer momento</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Suporte 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative w-full border-t border-cyan-500/20 bg-gradient-to-b from-slate-950 to-black">
        <div className="container px-4 md:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <HeartPulse className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">MediAI</span>
              </div>
              <p className="text-blue-200/60 leading-relaxed">
                O futuro da saúde impulsionado por inteligência artificial de última geração.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-cyan-400">Produto</h4>
              <ul className="space-y-3 text-blue-200/70">
                <li>
                  <Link href="/pricing" className="hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Preços
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Recursos
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-cyan-400">Empresa</h4>
              <ul className="space-y-3 text-blue-200/70">
                <li>
                  <Link href="/sobre" className="hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="/contato" className="hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Contato
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-cyan-400">Legal</h4>
              <ul className="space-y-3 text-blue-200/70">
                <li>
                  <Link href="/privacidade" className="hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/termos" className="hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Termos
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-cyan-500/10 text-center text-sm text-blue-200/50">
            <p>&copy; {new Date().getFullYear()} MediAI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
