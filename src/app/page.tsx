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
  Brain,
  Activity,
  HeartPulse,
  Check,
  Video,
  Star,
  CheckCircle2,
  Clock,
  Users,
  Play,
  Mic,
  Camera,
  Cpu,
  Award,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [videoStarted, setVideoStarted] = useState(false);

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
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-x-hidden">
      <Header />
      <main className="flex-1">
        {/* Hero Section - Clean and Modern */}
        <section className="relative w-full min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-30 dark:opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-[120px]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[150px]"></div>
          </div>

          <div className="container px-4 md:px-6 relative z-10 py-20 md:py-28">
            <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30">
                <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Tecnologia de Ponta em Saúde</span>
              </div>

              {/* Main Title */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                  <span className="text-slate-900 dark:text-white">O Futuro da </span>
                  <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                    Saúde
                  </span>
                  <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    Está Aqui
                  </span>
                </h1>
                
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-blue-100/80 leading-relaxed">
                  Diagnósticos instantâneos com IA de última geração. Consultas em tempo real com avatar médico inteligente.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">15+ Especialistas IA</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Video className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Consultas por Vídeo</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">100% Seguro (LGPD)</span>
                </div>
              </div>

              {/* Video Section */}
              <div className="w-full max-w-4xl mx-auto pt-4">
                <div className="relative group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  
                  {/* Video Container */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900">
                    <div className="aspect-video relative">
                      <iframe
                        src={videoStarted ? "https://drive.google.com/file/d/1BVY75ME-q2vRmQKSlboCwgFVdmNynZGvaOJRv4olDUk/preview?autoplay=1" : "about:blank"}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                      ></iframe>
                      
                      {/* Play Overlay */}
                      {!videoStarted && (
                        <div 
                          onClick={() => setVideoStarted(true)}
                          className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 cursor-pointer flex flex-col items-center justify-center gap-6 transition-all duration-300 hover:opacity-95"
                        >
                          {/* Animated Rings */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border border-cyan-500/30 animate-ping"></div>
                            <div className="absolute w-40 h-40 md:w-52 md:h-52 rounded-full border border-blue-500/20"></div>
                          </div>
                          
                          {/* Play Button */}
                          <div className="relative z-10">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30 transform hover:scale-105 transition-transform">
                              <Play className="h-8 w-8 md:h-10 md:w-10 text-white fill-white ml-1" />
                            </div>
                          </div>
                          
                          {/* Text */}
                          <div className="relative z-10 text-center space-y-2">
                            <p className="text-xl md:text-2xl font-bold text-white">
                              Clique para Assistir
                            </p>
                            <p className="text-sm md:text-base text-slate-400">
                              Descubra como a IA pode transformar sua saúde
                            </p>
                          </div>
                          
                          {/* Corner Icons */}
                          <div className="absolute top-6 left-6 p-2 rounded-xl bg-white/5">
                            <Stethoscope className="h-5 w-5 text-cyan-400/60" />
                          </div>
                          <div className="absolute top-6 right-6 p-2 rounded-xl bg-white/5">
                            <Brain className="h-5 w-5 text-purple-400/60" />
                          </div>
                          <div className="absolute bottom-6 left-6 p-2 rounded-xl bg-white/5">
                            <HeartPulse className="h-5 w-5 text-rose-400/60" />
                          </div>
                          <div className="absolute bottom-6 right-6 p-2 rounded-xl bg-white/5">
                            <Activity className="h-5 w-5 text-emerald-400/60" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg px-8 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30"
                >
                  <Link href="/register" className="flex items-center gap-2">
                    Começar Gratuitamente
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-lg px-8 rounded-xl"
                >
                  <Link href="/register" className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Criar Conta Grátis
                  </Link>
                </Button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-8 pt-8 w-full max-w-xl">
                <div className="text-center space-y-1">
                  <div className="text-3xl md:text-4xl font-bold text-cyan-600 dark:text-cyan-400">15+</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Especialistas IA</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Disponibilidade</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400">99.9%</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Precisão</div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Role para explorar</span>
            <div className="w-6 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-start justify-center p-1">
              <div className="w-1.5 h-3 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        </section>

        {/* AI Doctor Section */}
        <section className="relative w-full py-24 md:py-32 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 opacity-50 dark:opacity-30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 dark:bg-purple-500/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-200 dark:bg-cyan-500/20 rounded-full blur-[120px]"></div>
          </div>
          
          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Video */}
              <div className="relative order-2 lg:order-1">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900">
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
                  </div>
                  
                  {/* Floating Badges */}
                  <div className="absolute -top-4 -right-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-3 shadow-lg z-10">
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-3 shadow-lg z-10">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-8 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30">
                  <Video className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Consultas ao Vivo com IA</span>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  <span className="text-slate-900 dark:text-white">Conheça a sua </span>
                  <span className="bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                    Assistente Médica
                  </span>
                </h2>

                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Converse por voz e vídeo, mostre sintomas pela câmera e receba diagnósticos instantâneos.
                </p>

                <div className="space-y-4">
                  <FeatureItem 
                    icon={<Mic className="h-5 w-5" />}
                    title="Conversa Natural por Voz"
                    description="Fale naturalmente em português. A IA entende e responde em tempo real."
                    color="cyan"
                  />
                  <FeatureItem 
                    icon={<Camera className="h-5 w-5" />}
                    title="Visão por Câmera"
                    description="Mostre sintomas visuais. A IA analisa manchas, inchaços e alterações."
                    color="purple"
                  />
                  <FeatureItem 
                    icon={<Cpu className="h-5 w-5" />}
                    title="15+ Especialidades"
                    description="Cardiologia, dermatologia, neurologia e mais áreas médicas."
                    color="emerald"
                  />
                </div>

                <Button
                  asChild
                  size="lg"
                  className="h-12 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold px-6 rounded-xl"
                >
                  <Link href="/register" className="flex items-center gap-2">
                    Experimentar Agora
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative w-full py-24 md:py-32 bg-slate-50 dark:bg-slate-950 overflow-hidden">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 mx-auto">
                <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Tecnologia Revolucionária</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
                Recursos <span className="bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">Revolucionários</span>
              </h2>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Inteligência artificial de última geração trabalhando para sua saúde
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <FeatureCard
                icon={<Zap className="h-7 w-7" />}
                title="Diagnóstico Instantâneo"
                description="Upload de exames com análise por mais de 15 especialistas IA em segundos."
                color="cyan"
              />
              <FeatureCard
                icon={<Video className="h-7 w-7" />}
                title="Consultas por Vídeo"
                description="Converse com avatar médico realista por vídeo em tempo real."
                color="purple"
              />
              <FeatureCard
                icon={<Brain className="h-7 w-7" />}
                title="IA Especializada"
                description="15+ especialistas virtuais analisam seus exames simultâneamente."
                color="blue"
              />
              <FeatureCard
                icon={<ShieldCheck className="h-7 w-7" />}
                title="Segurança LGPD"
                description="Seus dados protegidos com criptografia de nível bancário."
                color="emerald"
              />
              <FeatureCard
                icon={<Clock className="h-7 w-7" />}
                title="Disponível 24/7"
                description="Atendimento a qualquer hora, todos os dias da semana."
                color="orange"
              />
              <FeatureCard
                icon={<TrendingUp className="h-7 w-7" />}
                title="Plano de Bem-Estar"
                description="Receita personalizada de dieta, exercícios e saúde mental."
                color="rose"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative w-full py-24 md:py-32 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px]"></div>
          </div>
          
          <div className="container px-4 md:px-6 relative z-10 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Comece sua jornada para uma saúde melhor hoje
              </h2>
              <p className="text-lg md:text-xl text-white/90">
                Junte-se a milhares de pessoas que já transformaram sua saúde com IA
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  asChild
                  size="lg"
                  className="h-14 bg-white text-blue-600 hover:bg-slate-100 font-semibold text-lg px-8 rounded-xl shadow-xl"
                >
                  <Link href="/register" className="flex items-center gap-2">
                    Criar Conta Grátis
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 border-2 border-white/50 text-white hover:bg-white/10 font-semibold text-lg px-8 rounded-xl"
                >
                  <Link href="/login">
                    Já tenho conta
                  </Link>
                </Button>
              </div>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-6 pt-8">
                <div className="flex items-center gap-2 text-white/80">
                  <Check className="h-5 w-5" />
                  <span className="text-sm">7 dias grátis</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Check className="h-5 w-5" />
                  <span className="text-sm">Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Check className="h-5 w-5" />
                  <span className="text-sm">Cancele quando quiser</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-12 bg-slate-900 dark:bg-slate-950 border-t border-slate-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MediAI</span>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacidade</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Contato</Link>
              </div>
              <p className="text-sm text-slate-500">
                 2025 MediAI. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureItem({ icon, title, description, color }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: 'cyan' | 'purple' | 'emerald' | 'blue';
}) {
  const colors = {
    cyan: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: 'cyan' | 'purple' | 'emerald' | 'blue' | 'orange' | 'rose';
}) {
  const colors = {
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/20',
    rose: 'from-rose-500 to-rose-600 shadow-rose-500/20',
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-4 shadow-lg text-white`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
