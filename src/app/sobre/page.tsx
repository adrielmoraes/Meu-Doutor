import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/header";
import Link from "next/link";
import { Brain, Shield, Zap, Heart, Users, Award, Sparkles, Stethoscope, Activity } from "lucide-react";

export default function SobreNosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                Sobre a MediAI
              </h1>
              <p className="text-xl md:text-2xl text-blue-200/80 leading-relaxed">
                Revolucionando o acesso à saúde através da inteligência artificial
              </p>
            </div>
          </div>
        </section>

        {/* Nossa História */}
        <section className="relative w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20 shadow-2xl">
                <CardContent className="p-8 md:p-12 space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-6">Nossa História</h2>
                  <p className="text-lg text-blue-100/80 leading-relaxed">
                    A MediAI nasceu de uma visão clara: democratizar o acesso a diagnósticos médicos de qualidade
                    através da inteligência artificial. Fundada em 2024, nossa plataforma foi desenvolvida por uma
                    equipe multidisciplinar de médicos, engenheiros de software e especialistas em IA.
                  </p>
                  <p className="text-lg text-blue-100/80 leading-relaxed">
                    Percebemos que milhões de pessoas enfrentam longas esperas para consultas médicas, dificuldade
                    de acesso a especialistas e altos custos com saúde. Decidimos usar a tecnologia mais avançada
                    disponível para mudar essa realidade.
                  </p>
                  <p className="text-lg text-blue-100/80 leading-relaxed">
                    Hoje, a MediAI é uma plataforma completa que combina análise de exames por mais de 25 especialistas IA,
                    consultas ao vivo por vídeo, monitoramento contínuo de saúde e planos de bem-estar personalizados.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Nossa Missão */}
        <section className="relative w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-cyan-300">Missão</h3>
                  <p className="text-blue-100/70 leading-relaxed">
                    Tornar diagnósticos médicos de qualidade acessíveis a todos, usando inteligência artificial
                    para reduzir custos e tempo de espera.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-purple-300">Visão</h3>
                  <p className="text-blue-100/70 leading-relaxed">
                    Ser a plataforma líder global em saúde assistida por IA, combinando tecnologia de ponta
                    com cuidado humanizado.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-300">Valores</h3>
                  <p className="text-blue-100/70 leading-relaxed">
                    Ética, privacidade, precisão e compromisso com a saúde e bem-estar de nossos pacientes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Tecnologia */}
        <section className="relative w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Nossa Tecnologia
                </h2>
                <p className="text-lg text-blue-200/70 max-w-3xl mx-auto">
                  Utilizamos as ferramentas mais avançadas disponíveis para garantir precisão e qualidade
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <Brain className="h-6 w-6 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-bold text-cyan-300">Modelos de Inteligência Artificial Avançados</h3>
                    </div>
                    <p className="text-blue-100/70 leading-relaxed">
                      Motor de inteligência artificial multimodal de última geração, capaz de analisar
                      texto, imagens e dados médicos complexos com precisão superior.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-purple-500/20">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-purple-300">Infraestrutura de Comunicação em Tempo Real</h3>
                    </div>
                    <p className="text-blue-100/70 leading-relaxed">
                      Plataforma de comunicação em tempo real que permite consultas por vídeo e voz de alta
                      qualidade com baixa latência e criptografia end-to-end.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-emerald-500/20">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-emerald-300">Avatares Virtuais Hiper-Realistas</h3>
                    </div>
                    <p className="text-blue-100/70 leading-relaxed">
                      Tecnologia avançada de avatares que cria interações naturais
                      e humanizadas com assistentes médicos virtuais.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-orange-500/20">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-bold text-orange-300">Segurança e Pagamentos</h3>
                    </div>
                    <p className="text-blue-100/70 leading-relaxed">
                      Processador de pagamentos seguro com criptografia de dados médicos e
                      conformidade total com LGPD e normas brasileiras de saúde.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Especialistas IA */}
        <section className="relative w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  25+ Especialistas IA
                </h2>
                <p className="text-lg text-blue-200/70">
                  Cada exame é analisado simultaneamente por múltiplos especialistas virtuais
                </p>
              </div>

              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      "Cardiologia",
                      "Neurologia",
                      "Dermatologia",
                      "Endocrinologia",
                      "Gastroenterologia",
                      "Ginecologia",
                      "Oftalmologia",
                      "Ortopedia",
                      "Otorrinolaringologia",
                      "Pediatria",
                      "Psiquiatria",
                      "Pneumologia",
                      "Radiologia",
                      "Urologia",
                      "Nutrição",
                      "Oncologia",
                      "Hematologia",
                      "Infectologia",
                      "Geriatria",
                      "Angiologia",
                      "Mastologia",
                      "Alergologia",
                      "Medicina Esportiva",
                      "Genética",
                      "Nefrologia",
                      "Reumatologia"
                    ].map((especialidade, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20 text-center"
                      >
                        <Stethoscope className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-blue-100">{especialidade}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Compromisso com a Saúde */}
        <section className="relative w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20 shadow-2xl">
                <CardContent className="p-8 md:p-12 space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <Award className="h-8 w-8 text-cyan-400" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-cyan-300">Nosso Compromisso</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Shield className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-cyan-300 mb-2">Privacidade e Segurança</h3>
                        <p className="text-blue-100/70 leading-relaxed">
                          Seus dados médicos são criptografados e protegidos com os mais altos padrões de segurança.
                          Conformidade total com LGPD e legislação brasileira de saúde.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Brain className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-300 mb-2">IA Complementar, Não Substituta</h3>
                        <p className="text-blue-100/70 leading-relaxed">
                          Nossa IA é uma ferramenta de triagem e apoio diagnóstico. Sempre recomendamos consulta
                          com médicos reais para diagnósticos definitivos e tratamentos.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Zap className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-emerald-300 mb-2">Inovação Contínua</h3>
                        <p className="text-blue-100/70 leading-relaxed">
                          Investimos constantemente em pesquisa e desenvolvimento para melhorar nossos algoritmos
                          e oferecer diagnósticos cada vez mais precisos.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                Junte-se a Nós
              </h2>
              <p className="text-xl text-blue-200/70">
                Faça parte da revolução da saúde digital
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg px-10 rounded-xl shadow-2xl shadow-cyan-500/30">
                  <Link href="/register/patient">
                    Começar Agora
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 font-semibold text-lg px-10 rounded-xl backdrop-blur-sm">
                  <Link href="/contato">
                    Entrar em Contato
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative w-full border-t border-cyan-500/20 bg-gradient-to-b from-slate-950 to-black py-8">
        <div className="container px-4 md:px-6 text-center text-sm text-blue-200/50">
          <p>&copy; {new Date().getFullYear()} MediAI. Todos os direitos reservados.</p>
          <p className="mt-2">
            <Link href="/privacidade" className="hover:text-cyan-300 transition-colors">Política de Privacidade</Link>
            {" | "}
            <Link href="/termos" className="hover:text-cyan-300 transition-colors">Termos de Uso</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
