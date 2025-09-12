
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
// import Image from "next/image";
import { Stethoscope, ShieldCheck, Zap, ArrowRight, PlayCircle, Sparkles, Lock, Plug, Globe } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-48 xl:py-64 text-black text-center md:text-left" style={{ background: 'linear-gradient(to right, #edb6d9, #f2f3ef)' }}>
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 xl:gap-20 items-center justify-center">
              <div className="space-y-6 lg:space-y-8">
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl/tight leading-tight">
                  IA Conversacional para Saúde Personalizada
                </h1>
                <p className="max-w-[700px] text-lg md:text-xl text-black/80 mx-auto md:mx-0">
                  Converse em tempo real com modelos de IA que simulam interações humanas para consultas ágeis, precisas e seguras.
                </p>
                <div className="flex flex-col gap-[30%] min-[400px]:flex-row justify-center md:justify-start">
                  <Button asChild size="xl" className="w-full min-[400px]:w-auto h-14 sm:h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
                    <Link href="/register/patient">Comece Agora</Link>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="xl" className="w-full min-[400px]:w-auto h-14 sm:h-14 border-2 border-emerald-500/70 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 font-semibold text-base sm:text-lg px-6 sm:px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                        <PlayCircle className="h-5 w-5" />
                        Ver Demo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] p-0 bg-transparent border-none">
                      <div className="aspect-video w-full">
                        <iframe
                          className="w-full h-full rounded-2xl shadow-2xl"
                          src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=example" // Substitua pelo vídeo real
                          title="MediAI Demo"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <img
                src="/brain-infinity.svg"
                alt="Logo de cérebro e infinito representando IA infinita para saúde"
                width={800}
                height={600}
                className="mx-auto aspect-video overflow-hidden rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 transition-all duration-500 hover:scale-105 sm:w-full lg:order-last"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 sm:py-16 md:py-28 lg:py-36" style={{ background: 'linear-gradient(to right, #edb6d9, #f2f3ef)' }}>
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl text-black">
                Como o MediAI Transforma sua Jornada de Saúde
              </h2>
              <p className="max-w-[900px] text-lg text-black md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Nossa plataforma oferece ferramentas poderosas tanto para pacientes quanto para médicos, simplificando o acesso a cuidados de saúde com inovação e segurança.
              </p>
            </div>
            <div className="mx-auto grid max-w-6xl items-start gap-10 sm:grid-cols-2 md:gap-14 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center space-y-5 p-8 rounded-xl transition-all duration-300 hover:scale-105" style={{ background: 'linear-gradient(to right, #f2f3ef, #edb6d9)', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                <div className="p-4 rounded-full bg-primary/20 transition-all duration-300 hover:bg-primary/30">
                  <Zap className="h-9 w-9" style={{ color: '#10b981' }} />
                </div>
                <h3 className="text-2xl font-bold text-black">Análise Rápida com IA</h3>
                <p className="text-base text-black leading-relaxed">
                  Faça o upload dos seus exames (PDF ou imagem) e receba uma análise preliminar detalhada em minutos, com explicações claras e simples.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center space-y-5 p-8 rounded-xl transition-all duration-300 hover:scale-105" style={{ background: 'linear-gradient(to right, #f2f3ef, #edb6d9)', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                <div className="p-4 rounded-full bg-primary/20 transition-all duration-300 hover:bg-primary/30">
                    <Stethoscope className="h-9 w-9" style={{ color: '#10b981' }} />
                </div>
                <h3 className="text-2xl font-bold text-black">Conexão com Médicos</h3>
                <p className="text-base text-black leading-relaxed">
                  Valide o diagnóstico da IA com médicos qualificados da nossa rede através de consultas virtuais ou agendamentos flexíveis.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center space-y-5 p-8 rounded-xl transition-all duration-300 hover:scale-105" style={{ background: 'linear-gradient(to right, #f2f3ef, #edb6d9)', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                 <div className="p-4 rounded-full bg-primary/20 transition-all duration-300 hover:bg-primary/30">
                     <ShieldCheck className="h-9 w-9" style={{ color: '#10b981' }} />
                 </div>
                <h3 className="text-2xl font-bold text-black">Seguro e Confiável</h3>
                <p className="text-base text-black leading-relaxed">
                  Seus dados são protegidos com criptografia de ponta a ponta, garantindo total privacidade e conformidade com as normas de saúde.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo / Try It Section */}
        <section id="demo" className="w-full py-16 md:py-28 lg:py-36 text-black" style={{ background: 'linear-gradient(to right, #edb6d9, #f2f3ef)' }}>
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="space-y-6 max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Experimente o MediAI em Ação
                </h2>
                <p className="text-lg md:text-xl text-black/80">
                  Veja como nossa IA conversacional pode transformar a forma como você gerencia sua saúde. Descubra os benefícios reais.
                </p>
                <Button asChild size="lg" className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
                  <Link href="/register/patient">Experimente Gratuitamente <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Highlights Section */}
        <section id="tech" className="w-full py-16 md:py-28 lg:py-36 text-black" style={{ background: 'linear-gradient(to right, #edb6d9, #f2f3ef)' }}>
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Destaques Técnicos
              </h2>
              <p className="text-lg md:text-xl text-black/80 max-w-[800px] mx-auto">
                Descubra as tecnologias de ponta que impulsionam o MediAI, garantindo uma experiência fluida, segura e inovadora.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Highlight 1 */}
              <div className="flex items-start gap-4 p-6 rounded-xl transition-all duration-300" style={{ background: 'linear-gradient(to right, #f2f3ef, #edb6d9)', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                <div className="p-3 rounded-full bg-primary/15">
                  <Sparkles className="h-6 w-6" style={{ color: '#10b981' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Conversas naturais</h3>
                  <p className="text-sm text-black/80">Interações fluidas que simulam um atendimento humano.</p>
                </div>
              </div>
              {/* Highlight 2 */}
              <div className="flex items-start gap-4 p-6 rounded-xl transition-all duration-300" style={{ background: 'linear-gradient(to right, #f2f3ef, #edb6d9)', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                <div className="p-3 rounded-full bg-primary/15">
                  <Lock className="h-6 w-6" style={{ color: '#10b981' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Segurança e privacidade</h3>
                  <p className="text-sm text-black/80">Proteção de dados sensíveis com boas práticas de segurança.</p>
                </div>
              </div>
              {/* Highlight 3 */}
              <div className="flex items-start gap-4 p-6 rounded-xl transition-all duration-300" style={{ background: 'linear-gradient(to right, #f2f3ef, #edb6d9)', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                <div className="p-3 rounded-full bg-primary/15">
                  <Plug className="h-6 w-6" style={{ color: '#10b981' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Integração fácil</h3>
                  <p className="text-sm text-black/80">APIs simples para embutir a experiência no seu fluxo.</p>
                </div>
              </div>
              {/* Highlight 4 */}
              <div className="flex items-start gap-4 p-6 rounded-xl transition-all duration-300" style={{ background: 'linear-gradient(to right, #f2f3ef, #edb6d9)', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                <div className="p-3 rounded-full bg-primary/15">
                  <Globe className="h-6 w-6" style={{ color: '#10b981' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Alcance global</h3>
                  <p className="text-sm text-black/80">Experiência acessível e preparada para múltiplos idiomas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t border-border bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="container px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm md:text-base text-muted-foreground/80">&copy; {new Date().getFullYear()} MediAI. Todos os direitos reservados.</p>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground/90">
            <Link href="#" className="hover:text-foreground transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Termos</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contato</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}