
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import { Stethoscope, ShieldCheck, Zap, ArrowRight, PlayCircle, Sparkles, Lock, Brain, Activity, HeartPulse, Check } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-x-hidden">
      <Header />
      <main className="flex-1">
        {/* Hero Section - Futuristic */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 xl:py-48 overflow-hidden">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
          
          {/* Floating Orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
          
          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm text-cyan-300">Powered by Gemini 2.5 Flash AI</span>
                </div>
                
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl/tight leading-tight bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                  O Futuro da Saúde Está Aqui
                </h1>
                
                <p className="max-w-[700px] text-lg md:text-xl text-blue-100/80 leading-relaxed">
                  Diagnósticos instantâneos com IA, consultas em tempo real e monitoramento personalizado. Sua saúde revolucionada pela inteligência artificial.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg px-8 rounded-xl shadow-2xl shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/40">
                    <Link href="/register/patient" className="flex items-center gap-2">
                      Começar Agora
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="lg" className="h-14 border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 font-semibold text-lg px-8 rounded-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                        <PlayCircle className="h-5 w-5" />
                        Ver Demo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] p-0 bg-transparent border-none">
                      <div className="aspect-video w-full">
                        <iframe
                          className="w-full h-full rounded-2xl shadow-2xl"
                          src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=example"
                          title="MediAI Demo"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 pt-8">
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-cyan-400">15+</div>
                    <div className="text-sm text-blue-200/70">Especialistas IA</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-cyan-400">24/7</div>
                    <div className="text-sm text-blue-200/70">Disponibilidade</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-cyan-400">99.9%</div>
                    <div className="text-sm text-blue-200/70">Precisão</div>
                  </div>
                </div>
              </div>
              
              {/* 3D Visual Element */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl blur-3xl"></div>
                <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/20">
                      <Brain className="h-12 w-12 text-cyan-400 mb-4" />
                      <h3 className="font-bold text-lg mb-2">IA Conversacional</h3>
                      <p className="text-sm text-blue-200/70">Converse naturalmente com nossos agentes especializados</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
                      <Activity className="h-10 w-10 text-purple-400 mb-3" />
                      <h3 className="font-bold mb-2">Análise em Tempo Real</h3>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-emerald-500/20">
                      <HeartPulse className="h-10 w-10 text-emerald-400 mb-3" />
                      <h3 className="font-bold mb-2">Monitoramento 24/7</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative w-full py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/50 to-transparent"></div>
          
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Recursos Revolucionários
              </h2>
              <p className="text-lg text-blue-200/70 max-w-3xl mx-auto">
                Tecnologia de ponta para transformar completamente sua experiência de saúde
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Feature Cards */}
              <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Zap className="h-7 w-7 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Diagnóstico Instantâneo</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Upload de exames com análise por 15 especialistas IA em segundos. Resultados detalhados em linguagem clara.
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Stethoscope className="h-7 w-7 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Consultas ao Vivo</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Converse por voz e vídeo com IA médica avançada. Conexão direta com médicos reais quando necessário.
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold">100% Seguro</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Criptografia end-to-end, conformidade LGPD e proteção total dos seus dados médicos sensíveis.
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                    <Brain className="h-7 w-7 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold">15 Especialistas IA</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Cardiologia, neurologia, dermatologia e mais. Cada especialista analisa seu caso em paralelo.
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                    <Activity className="h-7 w-7 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Monitoramento Contínuo</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Acompanhamento personalizado da sua saúde com alertas inteligentes e recomendações proativas.
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-pink-500/20 hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/20 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                    <HeartPulse className="h-7 w-7 text-pink-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Bem-Estar Personalizado</h3>
                  <p className="text-blue-200/70 leading-relaxed">
                    Recomendações de nutrição, exercícios e lifestyle baseadas em IA para seu perfil único.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative w-full py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/50 via-blue-950/50 to-purple-950/50"></div>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
          
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                Experimente Gratuitamente por 5 Dias
              </h2>
              <p className="text-xl text-blue-200/70">
                Teste todos os recursos premium sem compromisso. Cancele quando quiser.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg px-10 rounded-xl shadow-2xl shadow-cyan-500/30 transition-all duration-300 transform hover:scale-105">
                  <Link href="/register/patient">
                    Começar Teste Grátis
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 font-semibold text-lg px-10 rounded-xl backdrop-blur-sm">
                  <Link href="/pricing">
                    Ver Planos e Preços
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="relative w-full border-t border-cyan-500/20 bg-gradient-to-b from-slate-950 to-black">
        <div className="container px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-cyan-400">MediAI</h3>
              <p className="text-sm text-blue-200/60">
                O futuro da saúde impulsionado por inteligência artificial.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-cyan-400">Produto</h4>
              <ul className="space-y-2 text-sm text-blue-200/70">
                <li><Link href="/pricing" className="hover:text-cyan-300 transition-colors">Preços</Link></li>
                <li><Link href="#features" className="hover:text-cyan-300 transition-colors">Recursos</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-cyan-400">Empresa</h4>
              <ul className="space-y-2 text-sm text-blue-200/70">
                <li><Link href="#" className="hover:text-cyan-300 transition-colors">Sobre</Link></li>
                <li><Link href="#" className="hover:text-cyan-300 transition-colors">Contato</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-cyan-400">Legal</h4>
              <ul className="space-y-2 text-sm text-blue-200/70">
                <li><Link href="#" className="hover:text-cyan-300 transition-colors">Privacidade</Link></li>
                <li><Link href="#" className="hover:text-cyan-300 transition-colors">Termos</Link></li>
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
