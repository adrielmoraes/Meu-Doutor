
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import Image from "next/image";
import { Stethoscope, ShieldCheck, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Sua Saúde Conectada. Diagnósticos Inteligentes.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  MediAI utiliza inteligência artificial para oferecer análises preliminares de exames e conectar você a médicos qualificados. Rápido, seguro e inovador.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white">
                    <Link href="/register">Quero me Cadastrar</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">Já tenho conta</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://picsum.photos/600/400"
                alt="Médica sorrindo em um ambiente de consultório moderno"
                width={600}
                height={400}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                data-ai-hint="doctor smiling"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Como o MediAI Transforma sua Jornada de Saúde</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Nossa plataforma oferece ferramentas poderosas tanto para pacientes quanto para médicos, simplificando o acesso a cuidados de saúde.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                    <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Análise Rápida com IA</h3>
                <p className="text-sm text-muted-foreground">
                  Faça o upload dos seus exames (PDF ou imagem) e receba uma análise preliminar detalhada em minutos, com explicações claras e simples.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                    <Stethoscope className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Conexão com Médicos</h3>
                <p className="text-sm text-muted-foreground">
                  Valide o diagnóstico da IA com médicos qualificados da nossa rede através de consultas virtuais ou agendamentos flexíveis.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="p-3 rounded-full bg-primary/10">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Seguro e Confiável</h3>
                <p className="text-sm text-muted-foreground">
                  Seus dados são protegidos com criptografia de ponta a ponta, garantindo total privacidade e conformidade com as normas de saúde.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-center w-full h-16 border-t">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} MediAI. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
