
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import Image from "next/image";
import { Stethoscope, ShieldCheck, Zap, ArrowRight, PlayCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-48 xl:py-64 bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white text-center md:text-left">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 xl:gap-20 items-center justify-center">
              <div className="space-y-6 lg:space-y-8">
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl/tight leading-tight">
                  IA Conversacional para Saúde Personalizada
                </h1>
                <p className="max-w-[700px] text-lg md:text-xl text-white/80 mx-auto md:mx-0">
                  Converse em tempo real com modelos de IA que simulam interações humanas para consultas ágeis, precisas e seguras.
                </p>
                <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center md:justify-start">
                  <Button asChild size="xl" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg px-8 py-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
                    <Link href="/register" className="flex items-center gap-2">Experimente a IA Conversacional <ArrowRight className="h-5 w-5" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="xl" className="border-white text-white hover:bg-white/10 font-semibold text-lg px-8 py-6 rounded-lg transition-all duration-300 transform hover:scale-105">
                    <Link href="#features" className="flex items-center gap-2">Saiba Mais <ArrowRight className="h-5 w-5" /></Link>
                  </Button>
                </div>
              </div>
              <Image
                src="/hologram-placeholder.png"
                alt="Holograma de IA conversacional para consultas médicas"
                width={800}
                height={600}
                className="mx-auto aspect-video overflow-hidden rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 transition-all duration-500 hover:scale-105 sm:w-full lg:order-last"
                priority
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-28 lg:py-36 bg-secondary/10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl text-foreground">
                Como o MediAI Transforma sua Jornada de Saúde
              </h2>
              <p className="max-w-[900px] text-lg text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Nossa plataforma oferece ferramentas poderosas tanto para pacientes quanto para médicos, simplificando o acesso a cuidados de saúde com inovação e segurança.
              </p>
            </div>
            <div className="mx-auto grid max-w-6xl items-start gap-10 sm:grid-cols-2 md:gap-14 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center space-y-5 bg-card p-8 rounded-xl shadow-lg border border-border transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="p-4 rounded-full bg-primary/20 text-primary transition-all duration-300 hover:bg-primary/30">
                    <Zap className="h-9 w-9" />
                </div>
                <h3 className="text-2xl font-bold text-card-foreground">Análise Rápida com IA</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Faça o upload dos seus exames (PDF ou imagem) e receba uma análise preliminar detalhada em minutos, com explicações claras e simples.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center space-y-5 bg-card p-8 rounded-xl shadow-lg border border-border transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="p-4 rounded-full bg-primary/20 text-primary transition-all duration-300 hover:bg-primary/30">
                    <Stethoscope className="h-9 w-9" />
                </div>
                <h3 className="text-2xl font-bold text-card-foreground">Conexão com Médicos</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Valide o diagnóstico da IA com médicos qualificados da nossa rede através de consultas virtuais ou agendamentos flexíveis.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center space-y-5 bg-card p-8 rounded-xl shadow-lg border border-border transition-all duration-300 hover:scale-105 hover:shadow-xl">
                 <div className="p-4 rounded-full bg-primary/20 text-primary transition-all duration-300 hover:bg-primary/30">
                    <ShieldCheck className="h-9 w-9" />
                </div>
                <h3 className="text-2xl font-bold text-card-foreground">Seguro e Confiável</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Seus dados são protegidos com criptografia de ponta a ponta, garantindo total privacidade e conformidade com as normas de saúde.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo / Try It Section */}
        <section id="demo" className="w-full py-16 md:py-28 lg:py-36 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 text-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Experimente o MediAI em Ação
                </h2>
                <p className="text-lg md:text-xl text-white/80 max-w-[700px]">
                  Veja como nossas conversas com IA simulam um atendimento humano, com respostas rápidas, linguagem natural e foco em segurança de dados.
                </p>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-5 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
                    <Link href="/register" className="flex items-center gap-2">Tentar agora <ArrowRight className="h-5 w-5" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10 font-semibold px-6 py-5 rounded-lg transition-all duration-300 transform hover:scale-105">
                    <Link href="#" className="flex items-center gap-2"><PlayCircle className="h-5 w-5" /> Assistir demo</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="/hologram-placeholder.png"
                alt="Demonstração do agente de IA do MediAI"
                width={800}
                height={600}
                className="mx-auto aspect-video overflow-hidden rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 transition-all duration-500 hover:scale-105"
              />
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