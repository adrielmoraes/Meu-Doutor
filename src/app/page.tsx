"use client";

import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import MediAILogo from "@/components/layout/mediai-logo";
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
  Star,
  CheckCircle2,
  Users,
  Play,
  Mic,
  Camera,
  Cpu,
  Dna,
  Pill,
  Microscope,
  Calendar,
  FileText,
  ChevronDown,
  Clock,
  Sparkle,
  Smile,
  Shield,
  Award,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [activeAudience, setActiveAudience] = useState<"patient" | "doctor">("patient");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [videoStarted, setVideoStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const SHOW_VSL = false;

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
    if (typeof window !== "undefined") {
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
        } catch (e) {}
      }
      checkAuth();
    }
  }, [router]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION - CLINICAL BRIGHT & LUMINOUS */}
        <section className="relative w-full pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-white via-cyan-50/40 to-slate-50">
          {/* Subtle Ambient Glow Circles */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-100/50 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-60 left-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="container px-4 md:px-6 relative z-10 mx-auto">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-cyan-200/80 shadow-sm shadow-cyan-500/10 transition-all hover:border-cyan-400">
                <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
                <span className="text-xs sm:text-sm font-semibold text-cyan-900 tracking-wide">
                  Medicina do Futuro • Inteligência Artificial & Acolhimento Humano
                </span>
              </div>

              {/* Main Headline with NLP & Emotional Trigger */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-cyan-900 leading-[1.15]">
                A certeza que acalma seu coração quando você mais precisa.
              </h1>

              {/* Persuasive Subtitle */}
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
                Nunca mais enfrente a angústia da espera ou a dúvida de um laudo difícil. 
                Tenha análises imediatas por IA, podcasts da sua saúde e telemedicina com médicos certificados.
              </p>

              {/* AUDIENCE SELECTOR SWITCH (PACIENTE VS MÉDICO) */}
              <div className="flex items-center justify-center p-1.5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/50 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAudience("patient")}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                    activeAudience === "patient"
                      ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25 scale-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Smile className="h-5 w-5" />
                  <span>Para Você & Sua Família</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAudience("doctor")}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                    activeAudience === "doctor"
                      ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25 scale-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Stethoscope className="h-5 w-5" />
                  <span>Para Médicos & Clínicas</span>
                </button>
              </div>

              {/* AUDIENCE DYNAMIC VALUE PROP */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-cyan-100 shadow-lg shadow-cyan-900/5 max-w-2xl w-full text-left transition-all">
                {activeAudience === "patient" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-cyan-700 font-bold text-sm uppercase tracking-wide">
                      <HeartPulse className="h-4 w-4 text-cyan-500" />
                      <span>Cuidado Imediato para Pacientes</span>
                    </div>
                    <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                      💡 <strong>Envie exames em foto ou PDF:</strong> Receba explicações simples em segundos, 
                      tire dúvidas por voz com a assistente inteligente e consulte um médico com CRM quando desejar.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                        ✓ Sem termos médicos complicados
                      </span>
                      <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                        ✓ Podcast do seu exame em áudio
                      </span>
                      <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                        ✓ Atendimento 24 horas por dia
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-cyan-700 font-bold text-sm uppercase tracking-wide">
                      <Cpu className="h-4 w-4 text-cyan-500" />
                      <span>Copiloto Diagnóstico para Médicos</span>
                    </div>
                    <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                      ⚡ <strong>Potencialize seu consultório:</strong> Triagem automatizada de laudos, análise de 25+ especialidades 
                      e plataforma de telemedicina em total conformidade com o CFM e LGPD.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                        ✓ Menos 70% de tempo burocrático
                      </span>
                      <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                        ✓ Prontuário inteligente integrado
                      </span>
                      <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                        ✓ Receitas e laudos digitais
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* HERO CTA BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105 active:scale-95 border-0 flex items-center justify-center gap-3"
                >
                  <Link href={activeAudience === "patient" ? "/register/patient" : "/register/doctor"}>
                    <span>{activeAudience === "patient" ? "Experimentar Gratuitamente" : "Criar Conta de Médico"}</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 border-2 border-slate-300 bg-white text-slate-800 hover:text-cyan-950 hover:bg-cyan-50 hover:border-cyan-400 font-bold text-base sm:text-lg rounded-2xl shadow-sm transition-all duration-300"
                >
                  <Link href="#como-funciona">
                    Como Funciona o MediAI
                  </Link>
                </Button>
              </div>

              {/* LIVE METRICS BAR */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-8 border-t border-slate-200/80 w-full max-w-3xl">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600">25+</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500">IAs Especialistas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600">10K+</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500">Exames Analisados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600">99.9%</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500">Precisão Clínica</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600">24/7</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500">Acolhimento Total</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* DEMO / AI DOCTOR SHOWCASE */}
        <section className="relative py-16 md:py-24 bg-white border-y border-slate-200">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
              
              {/* Left Video Showcase */}
              <div className="lg:col-span-7">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 bg-slate-900">
                  <div className="aspect-video relative">
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
                  {/* Floating badge over video */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-2 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-800">Dra. Sofia • Online Agora</span>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200">
                  <Video className="h-4 w-4 text-cyan-600" />
                  <span className="text-xs font-bold text-cyan-800 uppercase tracking-wide">Assistente Médica por Vídeo & Voz</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-cyan-900 leading-tight">
                  Converse naturalmente. Sem pressa, sem julgamentos.
                </h2>

                <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
                  Fale sobre o que está sentindo como falaria com um amigo. A assistente de IA médica escuta suas palavras, 
                  analisa fotos de alterações e orienta você com o cuidado e a clareza que você merece.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <Mic className="h-5 w-5 text-cyan-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Fale por voz em português</h4>
                      <p className="text-slate-500 text-xs">Sem digitação complexa. Respostas em tempo real.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <Camera className="h-5 w-5 text-cyan-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Mostre sintomas pela câmera</h4>
                      <p className="text-slate-500 text-xs">Identificação de manchas, lesões e sinais de alerta com visão computacional.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: PAIN POINT & TRANSFORMATION (NLP & EMOTIONAL TRIGGER) */}
        <section className="py-20 md:py-32 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100/60 border border-cyan-200 text-cyan-900 font-bold text-xs uppercase tracking-wider">
                <Shield className="h-4 w-4 text-cyan-600" />
                O Fim da Angústia da Dúvida
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-900">
                Você não precisa mais passar noites em claro pesquisando sintomas.
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                A internet comum gera medo e desinformação. O MediAI entrega clareza médica fundamentada em diretrizes globais.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              
              {/* O Cenário Antigo (Dor) */}
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-red-200 shadow-lg shadow-red-500/5 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-cyan-950">Sem o MediAI</h3>
                      <p className="text-xs text-red-600 font-medium">Incerteza, demora e ansiedade</p>
                    </div>
                  </div>

                  <ul className="space-y-4 text-slate-600 text-sm sm:text-base">
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold">✕</span>
                      <span>Horas pesquisando no Google e lendo diagnósticos assustadores sem contexto.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold">✕</span>
                      <span>Dias ou semanas de espera aflita até a próxima consulta com o especialista.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold">✕</span>
                      <span>Laudos em PDF cheios de jargões técnicos incompreensíveis para quem não é médico.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold">✕</span>
                      <span>Histórico de saúde fragmentado em dezenas de papéis e clínicas diferentes.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-red-50/60 border border-red-100 text-red-800 text-xs sm:text-sm italic">
                  &quot;Eu passava dias sem dormir esperando a consulta só para entender o que significava uma alteração no meu exame de sangue.&quot;
                </div>
              </div>

              {/* O Cenário MediAI (Alívio & Transformação) */}
              <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-cyan-400 shadow-xl shadow-cyan-500/10 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-cyan-500 text-white font-bold text-xs px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                  Experiência MediAI
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-cyan-950">Com o MediAI</h3>
                      <p className="text-xs text-cyan-600 font-bold">Alívio imediato, clareza e segurança</p>
                    </div>
                  </div>

                  <ul className="space-y-4 text-slate-700 text-sm sm:text-base">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span><strong>Resposta em segundos:</strong> IA médica treinada nos mais recentes consensos internacionais.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span><strong>Podcast individualizado:</strong> Ouça a explicação do seu laudo em linguagem acolhedora.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span><strong>Validação com médicos reais:</strong> Agende teleconsultas em HD com especialistas quando precisar.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span><strong>Prontuário vitalício inteligente:</strong> Toda a sua linha do tempo médica centralizada e segura.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-cyan-50/80 border border-cyan-200 text-cyan-950 text-xs sm:text-sm font-medium">
                  ✨ <strong>Paz de espírito garantida:</strong> Você e sua família amparados 24 horas por dia, 7 dias por semana.
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION: HOW IT WORKS (3 SIMPLE STEPS) */}
        <section id="como-funciona" className="py-20 md:py-32 bg-white border-t border-slate-200">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold text-xs uppercase tracking-wider">
                <Zap className="h-4 w-4 text-cyan-600" />
                Simples Como Conversar
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-900">
                Como o MediAI cuida de você em 3 passos
              </h2>
              <p className="text-slate-600 text-lg">
                Projetado para ser intuitivo para todas as idades — de jovens a idosos.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              
              {/* Step 1 */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-cyan-950">Envie seu Exame ou Sintoma</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Tire uma foto do papel, anexe o PDF do laboratório ou simplesmente fale o que está sentindo para a Dra. Sofia.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-semibold text-cyan-700 flex items-center gap-1.5">
                  <Upload className="h-4 w-4" /> Suporta PDF, JPG, PNG e Áudio
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-cyan-950">25+ IAs Médicas Analisam</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Algoritmos de cardiologia, oncologia, genética e clínica geral cruzam biomarcadores e geram hipóteses estruturadas.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-semibold text-cyan-700 flex items-center gap-1.5">
                  <Brain className="h-4 w-4" /> Análise profunda em menos de 30s
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-cyan-950">Explicação Clara & Telemedicina</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Entenda tudo em palavras humanas, escute o podcast da sua saúde e, se desejar, fale ao vivo com um médico certificado.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-semibold text-cyan-700 flex items-center gap-1.5">
                  <Video className="h-4 w-4" /> Receitas e encaminhamentos válidos
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION: 25+ MEDICAL SPECIALTIES */}
        <section className="py-20 md:py-32 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100/70 border border-cyan-200 text-cyan-900 font-bold text-xs uppercase tracking-wider">
                <Microscope className="h-4 w-4 text-cyan-600" />
                Corpo Clínico Integrado
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-900">
                Uma junta médica completa ao seu dispor
              </h2>
              <p className="text-slate-600 text-lg">
                Especialistas treinados em milhares de protocolos para cobrir todas as áreas da sua vida.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { title: "Cardiologia", desc: "Arritmias, pressão, ECG e risco coronariano", icon: HeartPulse },
                { title: "Oncologia", desc: "Rastreamento precoce e interpretação tumoral", icon: Activity },
                { title: "Genética Médica", desc: "Predisposições hereditárias e longevidade", icon: Dna },
                { title: "Dermatologia", desc: "Lesões de pele, manchas e dermatoscopia", icon: Camera },
                { title: "Endocrinologia", desc: "Tireoide, diabetes e metabolismo hormonal", icon: Pill },
                { title: "Neurologia", desc: "Cefaleias, sono, cognição e memória", icon: Brain },
                { title: "Saúde da Mulher", desc: "Ginecologia preventiva e exames hormonais", icon: Sparkle },
                { title: "Pediatria", desc: "Acompanhamento infantil e curva de crescimento", icon: Users },
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-cyan-400 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 mb-4 group-hover:scale-110 transition-transform">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-cyan-950 text-base mb-1">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* SECTION: TESTIMONIALS (EMOTIONAL & SOCIAL PROOF) */}
        <section className="py-20 md:py-32 bg-white border-t border-slate-200">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-800 font-bold text-xs uppercase tracking-wider">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                Histórias Reais de Pacientes e Médicos
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-900">
                A tranquilidade que transforma vidas
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic">
                    &quot;Peguei o resultado de uma ressonância às 22h e estava desesperada com as palavras difíceis. 
                    Enviei para o MediAI e em 1 minuto ouvi a explicação em áudio acalmando tudo. No dia seguinte fiz a teleconsulta médica!&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-slate-200 mt-6">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center text-sm">
                    MC
                  </div>
                  <div>
                    <h5 className="font-bold text-cyan-950 text-sm">Maria Clara Santos</h5>
                    <p className="text-xs text-slate-500">Paciente • São Paulo, SP</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic">
                    &quot;Como médico cardiologista, o MediAI se tornou meu braço direito. Ele organiza os dados laboratoriais antes da consulta e me ajuda a focar 100% no olho no olho com o paciente.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-slate-200 mt-6">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center text-sm">
                    DR
                  </div>
                  <div>
                    <h5 className="font-bold text-cyan-950 text-sm">Dr. Rodrigo Martins</h5>
                    <p className="text-xs text-slate-500">Cardiologista • CRM 142.890</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic">
                    &quot;O podcast gerado sobre a minha saúde virou rotina matinal. Consigo entender minha evolução glicêmica e colesterol sem complicação. Recomendo para toda a família.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-slate-200 mt-6">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center text-sm">
                    AL
                  </div>
                  <div>
                    <h5 className="font-bold text-cyan-950 text-sm">Antônio Lima</h5>
                    <p className="text-xs text-slate-500">Paciente • Curitiba, PR</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION: FAQ (INTERACTIVE & EMPATHETIC) */}
        <section className="py-20 md:py-32 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto max-w-4xl">
            
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-900 font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="h-4 w-4 text-cyan-600" />
                Tire Suas Dúvidas
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-cyan-900">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "A Inteligência Artificial substitui meu médico?",
                  a: "Não. O MediAI atua como um copiloto e triagem inteligente para acelerar o entendimento de laudos e sintomas. Sempre oferecemos conexão direta com médicos reais para diagnósticos formais e prescrições."
                },
                {
                  q: "Meus dados de saúde e exames estão seguros?",
                  a: "Absolutamente. Utilizamos criptografia de nível bancário e hospitalar (AES-256) e estamos em total conformidade com a Lei Geral de Proteção de Dados (LGPD) e regulamentações do CFM."
                },
                {
                  q: "Como funciona o podcast personalizado da minha saúde?",
                  a: "Nossa IA sintetiza o histórico dos seus laudos recentes e gera um áudio agradável em formato de conversa, explicando o que cada índice significa e quais hábitos podem melhorar sua saúde."
                },
                {
                  q: "Sou médico. Como posso utilizar o MediAI na minha clínica?",
                  a: "Você pode se cadastrar gratuitamente na opção 'Sou Médico', validar seu CRM e começar a usar o copiloto de diagnóstico, gestão de teleconsultas em HD e prontuário digital com seus pacientes."
                }
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-cyan-950 hover:text-cyan-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                        openFaq === idx ? "rotate-180 text-cyan-500" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-5 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* SECTION: FINAL PERSUASIVE CTA */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-white to-cyan-50/50 border-t border-slate-200">
          <div className="container px-4 md:px-6 mx-auto max-w-4xl text-center space-y-8">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-900 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-cyan-600" />
              Comece Hoje Mesmo
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-cyan-900 leading-tight">
              Sua saúde não pode esperar a dúvida. Dê o primeiro passo agora.
            </h2>

            <p className="text-slate-600 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Junte-se a milhares de pessoas e profissionais que já transformaram o cuidado médico em uma experiência rápida, clara e humana.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                asChild
                size="lg"
                className="h-14 px-10 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105 border-0"
              >
                <Link href="/register">
                  Criar Minha Conta Grátis
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 px-8 border-2 border-slate-300 bg-white text-slate-800 hover:text-cyan-950 hover:bg-cyan-50 hover:border-cyan-400 font-bold text-lg rounded-2xl shadow-sm transition-all duration-300"
              >
                <Link href="/login">
                  Já Tenho uma Conta
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs sm:text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sem necessidade de cartão
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Total conformidade LGPD
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Suporte humanizado 24/7
              </span>
            </div>

          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-200 bg-white py-14">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4 md:col-span-1">
              <MediAILogo size="md" />
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                Inteligência artificial a serviço da vida. Diagnósticos preliminares em 30s, telemedicina em alta definição e acolhimento clínico humanizado.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-semibold text-cyan-900">
                <Shield className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                <span>Em conformidade com LGPD e CFM</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-cyan-950 mb-3.5 text-sm uppercase tracking-wider">Plataforma</h4>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li><Link href="/pricing" className="hover:text-cyan-600 transition-colors font-medium">Planos e Preços</Link></li>
                <li><Link href="#especialidades" className="hover:text-cyan-600 transition-colors font-medium">Especialidades Clínicas</Link></li>
                <li><Link href="#como-funciona" className="hover:text-cyan-600 transition-colors font-medium">Como Funciona</Link></li>
                <li><Link href="/register/patient" className="hover:text-cyan-600 transition-colors font-medium">Cadastro de Paciente</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-cyan-950 mb-3.5 text-sm uppercase tracking-wider">Institucional</h4>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li><Link href="/sobre" className="hover:text-cyan-600 transition-colors font-medium">Sobre a MediAI</Link></li>
                <li><Link href="/contato" className="hover:text-cyan-600 transition-colors font-medium">Fale Conosco</Link></li>
                <li><Link href="/register/doctor" className="hover:text-cyan-600 transition-colors font-medium">Para Médicos (CRM)</Link></li>
                <li><Link href="/login" className="hover:text-cyan-600 transition-colors font-medium">Área de Acesso</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-cyan-950 mb-3.5 text-sm uppercase tracking-wider">Segurança & Legal</h4>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li><Link href="/privacidade" className="hover:text-cyan-600 transition-colors font-medium">Política de Privacidade</Link></li>
                <li><Link href="/termos" className="hover:text-cyan-600 transition-colors font-medium">Termos de Uso</Link></li>
                <li><Link href="/contato" className="hover:text-cyan-600 transition-colors font-medium">Canal do DPO / LGPD</Link></li>
              </ul>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-relaxed">
                Desenvolvido sob rigorosas diretrizes éticas médicas e segurança de dados em saúde.
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} MediAI Saúde Inteligente Ltda. Todos os direitos reservados.</p>
            <p className="text-cyan-800 font-semibold">Em conformidade com a LGPD e diretrizes do CFM.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
