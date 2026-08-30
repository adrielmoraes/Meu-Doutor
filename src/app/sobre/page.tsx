import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/header";
import Link from "next/link";
import { Brain, Shield, Zap, Heart, Users, Award, Sparkles, Stethoscope, Activity, CheckCircle2 } from "lucide-react";

export default function SobreNosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      <Header />

      <main className="flex-1 relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/40 to-slate-50">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

        {/* Hero Section */}
        <section className="relative w-full py-16 md:py-24">
          <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-6xl">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 shadow-sm">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                <span className="text-xs sm:text-sm font-semibold text-cyan-900">Institucional • Saúde, Ética & Tecnologia</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-cyan-900 tracking-tight">
                Sobre a MediAI
              </h1>
              
              <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
                Revolucionando o acesso à medicina de alta precisão através da união entre inteligência artificial e acolhimento humano.
              </p>
            </div>
          </div>
        </section>

        {/* Nossa História */}
        <section className="relative w-full py-12">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl">
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-xl shadow-slate-900/5 space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-cyan-900">
                Nossa História
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                A <strong>MediAI</strong> nasceu de uma visão clara: democratizar o acesso a diagnósticos médicos rápidos e compreensíveis. Nossa plataforma foi desenvolvida por uma equipe multidisciplinar de médicos especialistas, cientistas de dados e engenheiros de inteligência artificial clínica.
              </p>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Percebemos que milhões de pessoas enfrentavam dias de angústia esperando por consultas apenas para entender o resultado de um exame, enquanto médicos sofriam com sobrecarga de burocracia e laudos desestruturados. Decidimos usar a mais avançada tecnologia para transformar essa realidade.
              </p>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Hoje, a MediAI conecta mais de 25 especialidades de inteligência artificial a uma rede de telemedicina em alta definição, permitindo que qualquer pessoa entenda sua saúde em segundos e receba acompanhamento médico contínuo.
              </p>
            </div>
          </div>
        </section>

        {/* Missão, Visão e Valores */}
        <section className="relative w-full py-12">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8">
              
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg shadow-slate-900/5 hover:border-cyan-300 hover:shadow-xl transition-all text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-cyan-950">Missão</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Tornar a compreensão da saúde e o suporte médico imediatos, claros e acessíveis a todos, eliminando a angústia da espera.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg shadow-slate-900/5 hover:border-cyan-300 hover:shadow-xl transition-all text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-cyan-950">Visão</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Ser o padrão ouro global em saúde assistida por inteligência artificial, unindo o rigor científico à empatia e cuidado humano.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg shadow-slate-900/5 hover:border-cyan-300 hover:shadow-xl transition-all text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-cyan-950">Valores</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Ética inegociável, privacidade absoluta dos dados (LGPD), rigor baseado em evidências e respeito à vida.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Nossa Tecnologia */}
        <section className="relative w-full py-16">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-900">
                Nossa Tecnologia
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                Infraestrutura de alta fidelidade desenvolvida para garantir diagnósticos preliminares precisos e seguros.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                    <Brain className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-cyan-950">Modelos Multimodais Médicos</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Motores neurais treinados em literatura científica internacional e diretrizes médicas atualizadas, capazes de analisar laudos, exames de sangue, imagem e sintomas em texto e voz.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                    <Activity className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-cyan-950">Telemedicina em Tempo Real</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Sistema de videoconferência de baixa latência e alta definição, permitindo contato direto entre médicos e pacientes com prontuário unificado na tela.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-cyan-950">Assistente Humanizada Dra. Sofia</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Processamento de linguagem natural que acolhe o paciente com tom amigável, traduzindo jargões complexos em explicações fáceis e acessíveis.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-cyan-950">Criptografia & Segurança LGPD</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Todos os dados de saúde são protegidos com padrão hospitalar AES-256 e armazenados em servidores com isolamento e auditoria permanente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compromisso com a Ética Médica */}
        <section className="relative w-full py-12">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl">
            <div className="bg-white rounded-3xl p-8 md:p-12 border-2 border-cyan-200 shadow-xl shadow-cyan-900/5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Award className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-900">
                    Nosso Compromisso com a Ética Médica
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-700 font-semibold">Em total consonância com as normas do CFM e ANS</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-cyan-950 text-base">Triagem & Apoio</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    A IA atua como acelerador e suporte à decisão, nunca substituindo o julgamento clínico soberano do médico.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-cyan-950 text-base">Validação Humana</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Prescrições e atestados são emitidos exclusivamente por médicos devidamente registrados e habilitados no CRM.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-cyan-950 text-base">Sigilo Profissional</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    O sigilo médico-paciente é inviolável e blindado por rigorosos protocolos de cibersegurança.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative w-full py-16 md:py-24 bg-gradient-to-b from-white to-cyan-50/50 border-t border-slate-200">
          <div className="container px-4 md:px-6 mx-auto text-center max-w-4xl space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-900 leading-tight">
              Faça parte da revolução da saúde digital
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Experimente a MediAI gratuitamente e veja como a tecnologia pode trazer tranquilidade para a sua vida.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="h-14 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-base sm:text-lg px-10 rounded-2xl shadow-xl shadow-cyan-500/25 border-0">
                <Link href="/register/patient">
                  Começar Agora Gratuitamente
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 border-2 border-slate-300 bg-white text-slate-800 hover:bg-cyan-50 hover:text-cyan-950 hover:border-cyan-400 font-bold text-base sm:text-lg px-8 rounded-2xl shadow-sm transition-all duration-300">
                <Link href="/contato">
                  Fale Conosco
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-slate-200 bg-white py-8">
        <div className="container px-4 md:px-6 mx-auto text-center text-sm text-slate-500 space-y-2">
          <p>&copy; {new Date().getFullYear()} MediAI Saúde Inteligente. Todos os direitos reservados.</p>
          <p className="text-xs">
            <Link href="/privacidade" className="hover:text-cyan-600 transition-colors">Política de Privacidade</Link>
            {" • "}
            <Link href="/termos" className="hover:text-cyan-600 transition-colors">Termos de Uso</Link>
            {" • "}
            <Link href="/contato" className="hover:text-cyan-600 transition-colors">Contato</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
