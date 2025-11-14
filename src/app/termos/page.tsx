"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import { FileText, AlertTriangle, Shield, CreditCard, ChevronRight } from "lucide-react";

const LAST_UPDATED = "29 de outubro de 2025";

export default function TermosPage() {
  const [activeSection, setActiveSection] = useState("");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const sections = [
    { id: "aceitacao", title: "1. Aceitação dos Termos" },
    { id: "definicoes", title: "2. Definições" },
    { id: "descricao-servicos", title: "3. Descrição dos Serviços" },
    { id: "disclaimers-medicos", title: "4. Disclaimers Médicos" },
    { id: "cadastro", title: "5. Cadastro e Conta" },
    { id: "responsabilidades-usuario", title: "6. Responsabilidades do Usuário" },
    { id: "responsabilidades-plataforma", title: "7. Responsabilidades da Plataforma" },
    { id: "assinaturas", title: "8. Assinaturas e Pagamentos" },
    { id: "cancelamento", title: "9. Cancelamento e Reembolso" },
    { id: "propriedade-intelectual", title: "10. Propriedade Intelectual" },
    { id: "limitacoes", title: "11. Limitações de Responsabilidade" },
    { id: "privacidade", title: "12. Privacidade e Proteção de Dados" },
    { id: "modificacoes", title: "13. Modificações nos Termos" },
    { id: "rescisao", title: "14. Rescisão e Suspensão" },
    { id: "lei-aplicavel", title: "15. Lei Aplicável e Jurisdição" },
    { id: "contato", title: "16. Contato" },
  ];

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
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-cyan-400" />
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                Termos de Uso
              </h1>
              <p className="text-xl md:text-2xl text-blue-200/80 leading-relaxed">
                Condições legais para uso da plataforma MediAI
              </p>
              <p className="text-sm text-blue-300/60">
                Última atualização: {LAST_UPDATED}
              </p>
            </div>
          </div>
        </section>

        <div className="container px-4 md:px-6 py-12">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sticky Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Índice
                    </h2>
                    <nav className="space-y-2">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                            activeSection === section.id
                              ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                              : "text-blue-200/70 hover:bg-cyan-500/10 hover:text-cyan-300"
                          }`}
                        >
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          <span className="line-clamp-2">{section.title}</span>
                        </button>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Aceitação */}
              <section id="aceitacao">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">1. Aceitação dos Termos</h2>
                    <p className="text-blue-100/80 leading-relaxed">
                      Ao acessar e utilizar a plataforma <strong className="text-cyan-300">MediAI</strong>, você 
                      ("Usuário", "você") concorda em ficar vinculado a estes Termos de Uso e à nossa Política de Privacidade.
                    </p>
                    <p className="text-blue-100/80 leading-relaxed">
                      Se você não concordar com qualquer parte destes termos, não utilize nossa plataforma.
                    </p>
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mt-6">
                      <p className="text-orange-300 font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        LEIA COM ATENÇÃO
                      </p>
                      <p className="text-blue-200/70">
                        Ao criar uma conta ou usar nossos serviços, você confirma que leu, compreendeu e concordou com estes 
                        Termos de Uso e com nossa Política de Privacidade.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Definições */}
              <section id="definicoes">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">2. Definições</h2>
                    <div className="space-y-3">
                      <div className="bg-cyan-500/10 border-l-4 border-cyan-500 p-4 rounded-r-lg">
                        <p className="text-blue-100/80">
                          <strong className="text-cyan-300">Plataforma:</strong> Sistema online MediAI acessível via web e aplicativos.
                        </p>
                      </div>
                      <div className="bg-purple-500/10 border-l-4 border-purple-500 p-4 rounded-r-lg">
                        <p className="text-blue-100/80">
                          <strong className="text-purple-300">Serviços:</strong> Análise de exames por IA, consultas virtuais, monitoramento de saúde e demais funcionalidades oferecidas.
                        </p>
                      </div>
                      <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                        <p className="text-blue-100/80">
                          <strong className="text-emerald-300">IA Médica:</strong> Sistemas de inteligência artificial especializados em análise médica (não substitui médicos reais).
                        </p>
                      </div>
                      <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 rounded-r-lg">
                        <p className="text-blue-100/80">
                          <strong className="text-orange-300">Usuário:</strong> Pessoa física que utiliza a Plataforma (paciente, médico ou administrador).
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Descrição dos Serviços */}
              <section id="descricao-servicos">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">3. Descrição dos Serviços</h2>
                    <p className="text-blue-100/80 leading-relaxed">
                      A MediAI é uma plataforma de saúde assistida por inteligência artificial que oferece:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li><strong className="text-cyan-300">Análise de Exames por IA:</strong> Upload de exames médicos analisados por 15 especialistas virtuais (cardiologia, neurologia, dermatologia, etc.)</li>
                      <li><strong className="text-purple-300">Consultas Virtuais ao Vivo:</strong> Conversas por voz e vídeo com assistentes médicos de IA e médicos reais credenciados</li>
                      <li><strong className="text-emerald-300">Diagnósticos Preliminares:</strong> Avaliações iniciais baseadas em IA para triagem e orientação</li>
                      <li><strong className="text-orange-300">Monitoramento de Saúde:</strong> Acompanhamento contínuo de sinais vitais e indicadores de saúde</li>
                      <li><strong className="text-pink-300">Planos de Bem-Estar:</strong> Recomendações personalizadas de nutrição, exercícios e lifestyle</li>
                      <li><strong className="text-blue-300">Histórico Médico Digital:</strong> Armazenamento seguro e organizado de exames e consultas</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* Disclaimers Médicos - SEÇÃO CRÍTICA */}
              <section id="disclaimers-medicos">
                <Card className="bg-gradient-to-br from-red-900/30 to-orange-900/30 backdrop-blur-xl border-red-500/40 shadow-2xl shadow-red-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-red-300 mb-4 flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8" />
                      4. Disclaimers Médicos Importantes
                    </h2>

                    <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6 mb-6">
                      <p className="text-red-200 font-bold text-lg mb-3">
                        ⚠️ AVISO CRÍTICO: LEIA COM ATENÇÃO
                      </p>
                      <p className="text-red-100/90 leading-relaxed">
                        A INTELIGÊNCIA ARTIFICIAL DA MEDIAI NÃO SUBSTITUI, EM NENHUMA HIPÓTESE, A AVALIAÇÃO, 
                        DIAGNÓSTICO E TRATAMENTO POR MÉDICOS REAIS DEVIDAMENTE LICENCIADOS.
                      </p>
                    </div>

                    <h3 className="text-xl font-semibold text-orange-300 mt-6">4.1. Limitações da IA Médica</h3>
                    <div className="space-y-3">
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                        <p className="text-blue-100/80 leading-relaxed">
                          <strong className="text-orange-300">Ferramenta de Triagem:</strong> Nossa IA é uma ferramenta de 
                          <strong> triagem, segunda opinião e apoio diagnóstico</strong>, não um diagnóstico médico definitivo.
                        </p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <p className="text-blue-100/80 leading-relaxed">
                          <strong className="text-red-300">Não é Substituto de Médico:</strong> A IA não pode e não deve 
                          substituir consultas presenciais, exames físicos ou avaliação clínica por profissionais de saúde.
                        </p>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                        <p className="text-blue-100/80 leading-relaxed">
                          <strong className="text-orange-300">Limitações Tecnológicas:</strong> Sistemas de IA podem cometer 
                          erros, ter vieses ou não detectar condições complexas. Precisão não é garantida em 100% dos casos.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-orange-300 mt-6">4.2. Responsabilidade do Paciente</h3>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                      <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                        <li>Sempre consulte um médico real para diagnósticos definitivos e tratamentos</li>
                        <li>Não tome decisões médicas importantes baseando-se exclusivamente em resultados da IA</li>
                        <li>Em caso de emergência médica, procure imediatamente atendimento presencial (UPA, pronto-socorro)</li>
                        <li>Continue seguindo recomendações do seu médico pessoal, mesmo que difiram da IA</li>
                        <li>Informe seu médico sobre análises e recomendações recebidas da MediAI</li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-semibold text-orange-300 mt-6">4.3. Emergências Médicas</h3>
                    <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6">
                      <p className="text-red-200 font-bold mb-2">
                        🚨 A MEDIAI NÃO É UM SERVIÇO DE EMERGÊNCIA
                      </p>
                      <p className="text-red-100/90 leading-relaxed mb-4">
                        Em caso de emergência médica (dor no peito, dificuldade respiratória grave, sangramento intenso, 
                        perda de consciência, etc.), ligue imediatamente para:
                      </p>
                      <div className="bg-red-600/30 rounded-lg p-4">
                        <p className="text-white font-bold text-xl text-center">
                          SAMU: 192 | Bombeiros: 193 | Emergência: 911
                        </p>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-orange-300 mt-6">4.4. Conformidade Médica</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Médicos que utilizam a plataforma são responsáveis por suas próprias decisões clínicas e devem 
                      estar devidamente licenciados pelo Conselho Regional de Medicina (CRM). A MediAI não interfere 
                      na relação médico-paciente.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Cadastro */}
              <section id="cadastro">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">5. Cadastro e Conta</h2>

                    <h3 className="text-xl font-semibold text-purple-300">5.1. Requisitos de Cadastro</h3>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Você deve ter pelo menos 18 anos ou consentimento de responsável legal</li>
                      <li>Fornecer informações verdadeiras, precisas e completas</li>
                      <li>Manter seus dados cadastrais atualizados</li>
                      <li>Aceitar nossa Política de Privacidade e conformidade com LGPD</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">5.2. Segurança da Conta</h3>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                      <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                        <li>Você é responsável por manter a confidencialidade de suas credenciais</li>
                        <li>Não compartilhe sua senha com terceiros</li>
                        <li>Notifique-nos imediatamente sobre qualquer uso não autorizado</li>
                        <li>Recomendamos ativar autenticação de dois fatores (2FA)</li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">5.3. Conta de Médicos</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Médicos devem fornecer número de CRM válido e documentação comprobatória. Reservamo-nos o direito 
                      de verificar credenciais antes de aprovar contas profissionais.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Responsabilidades do Usuário */}
              <section id="responsabilidades-usuario">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">6. Responsabilidades do Usuário</h2>

                    <h3 className="text-xl font-semibold text-purple-300">6.1. Uso Adequado</h3>
                    <p className="text-blue-100/80 leading-relaxed">Você concorda em:</p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Usar a plataforma apenas para fins legais e médicos legítimos</li>
                      <li>Não tentar burlar sistemas de segurança ou acessar dados de terceiros</li>
                      <li>Não fazer upload de conteúdo malicioso, ofensivo ou ilegal</li>
                      <li>Não usar a plataforma para fraudes ou atividades criminosas</li>
                      <li>Respeitar direitos de propriedade intelectual</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">6.2. Informações Fornecidas</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Você é responsável pela veracidade e precisão de todas as informações médicas que fornece. 
                      Informações incorretas podem resultar em análises imprecisas da IA.
                    </p>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">6.3. Conduta Proibida</h3>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                      <p className="text-blue-100/80 leading-relaxed mb-3">É estritamente proibido:</p>
                      <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                        <li>Criar contas falsas ou usar identidades de terceiros</li>
                        <li>Fazer engenharia reversa ou copiar sistemas da plataforma</li>
                        <li>Realizar scraping ou extração automatizada de dados</li>
                        <li>Sobrecarregar servidores com requisições excessivas</li>
                        <li>Revender ou redistribuir serviços sem autorização</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Responsabilidades da Plataforma */}
              <section id="responsabilidades-plataforma">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">7. Responsabilidades da Plataforma</h2>

                    <h3 className="text-xl font-semibold text-purple-300">7.1. Fornecimento de Serviços</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Nos comprometemos a:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Fornecer acesso aos serviços conforme descrito na plataforma</li>
                      <li>Manter sistemas de segurança e proteção de dados conforme LGPD</li>
                      <li>Processar análises de IA de forma ética e transparente</li>
                      <li>Disponibilizar suporte técnico dentro do horário comercial</li>
                      <li>Notificar sobre alterações significativas nos serviços</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">7.2. Disponibilidade</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Buscamos manter a plataforma disponível 24/7, mas não garantimos ausência total de interrupções. 
                      Podemos realizar manutenções programadas com aviso prévio.
                    </p>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">7.3. Moderação de Conteúdo</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Reservamo-nos o direito de remover conteúdo que viole estes termos ou legislação aplicável.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Assinaturas e Pagamentos */}
              <section id="assinaturas">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4 flex items-center gap-3">
                      <CreditCard className="h-8 w-8" />
                      8. Assinaturas e Pagamentos
                    </h2>

                    <h3 className="text-xl font-semibold text-purple-300">8.1. Planos e Preços</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Oferecemos diferentes planos de assinatura (Gratuito, Básico, Premium, Empresarial). 
                      Preços e recursos podem ser consultados em nossa página de preços.
                    </p>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">8.2. Processamento de Pagamentos</h3>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                      <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                        <li>Pagamentos são processados de forma segura por <strong className="text-cyan-300">processadores de pagamento certificados</strong></li>
                        <li>Não armazenamos informações completas de cartão de crédito</li>
                        <li>Aceitamos cartões de crédito, débito e outros métodos de pagamento disponíveis</li>
                        <li>Cobranças são em Reais (BRL)</li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">8.3. Cobrança Recorrente</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Planos pagos são cobrados automaticamente de forma recorrente (mensal ou anual) até cancelamento. 
                      Você autoriza cobranças automáticas ao se inscrever.
                    </p>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">8.4. Alterações de Preço</h3>
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                      <p className="text-blue-100/80 leading-relaxed">
                        Podemos alterar preços com aviso prévio de <strong>30 dias</strong>. Alterações não afetam 
                        ciclos de cobrança já iniciados. Você pode cancelar antes da próxima cobrança se não concordar 
                        com novos preços.
                      </p>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">8.5. Impostos</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Preços não incluem impostos aplicáveis (ISS, PIS, COFINS, etc.), que serão adicionados conforme 
                      legislação brasileira.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Cancelamento e Reembolso */}
              <section id="cancelamento">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">9. Cancelamento e Reembolso</h2>

                    <h3 className="text-xl font-semibold text-purple-300">9.1. Direito de Arrependimento (CDC)</h3>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                      <p className="text-blue-100/80 leading-relaxed">
                        Conforme Código de Defesa do Consumidor (Art. 49), você tem direito de cancelar assinatura 
                        dentro de <strong className="text-emerald-300">7 dias corridos</strong> após contratação, 
                        com reembolso integral de valores pagos.
                      </p>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">9.2. Cancelamento Regular</h3>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Você pode cancelar sua assinatura a qualquer momento através da plataforma</li>
                      <li>Cancelamento tem efeito ao final do período de cobrança atual</li>
                      <li>Você mantém acesso aos recursos pagos até o fim do período pago</li>
                      <li>Não há cobranças adicionais após cancelamento</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">9.3. Política de Reembolso</h3>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                      <p className="text-blue-100/80 leading-relaxed mb-3">Reembolsos são concedidos nas seguintes situações:</p>
                      <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                        <li><strong className="text-cyan-300">Direito de arrependimento:</strong> Reembolso integral em até 7 dias</li>
                        <li><strong className="text-purple-300">Cobrança indevida:</strong> Reembolso integral se comprovada</li>
                        <li><strong className="text-emerald-300">Indisponibilidade prolongada:</strong> Reembolso proporcional (mais de 48h consecutivas)</li>
                        <li><strong className="text-orange-300">Cancelamentos regulares:</strong> Sem reembolso de períodos já utilizados</li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">9.4. Prazo de Reembolso</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Reembolsos aprovados são processados em até <strong>10 dias úteis</strong> e creditados na 
                      forma de pagamento original.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Propriedade Intelectual */}
              <section id="propriedade-intelectual">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">10. Propriedade Intelectual</h2>

                    <h3 className="text-xl font-semibold text-purple-300">10.1. Propriedade da MediAI</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Todos os direitos de propriedade intelectual sobre a plataforma, incluindo mas não limitado a:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Software, código-fonte e algoritmos de IA</li>
                      <li>Design, interface e experiência do usuário</li>
                      <li>Logotipos, marcas e identidade visual</li>
                      <li>Conteúdo educacional e materiais informativos</li>
                      <li>Documentação e tutoriais</li>
                    </ul>
                    <p className="text-blue-100/80 leading-relaxed mt-4">
                      São de propriedade exclusiva da MediAI Tecnologia em Saúde Ltda. ou de seus licenciadores.
                    </p>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">10.2. Seus Dados</h3>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                      <p className="text-blue-100/80 leading-relaxed">
                        Você mantém todos os direitos sobre os dados médicos que envia à plataforma. Ao fazer upload, 
                        você nos concede licença limitada para processar esses dados conforme descrito em nossa 
                        Política de Privacidade.
                      </p>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">10.3. Uso Permitido</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Concedemos licença não exclusiva, intransferível e revogável para usar a plataforma conforme 
                      estes termos. Você não pode copiar, modificar, distribuir ou criar trabalhos derivados.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Limitações de Responsabilidade */}
              <section id="limitacoes">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">11. Limitações de Responsabilidade</h2>

                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-6">
                      <p className="text-orange-300 font-semibold mb-2">⚠️ IMPORTANTE</p>
                      <p className="text-blue-200/70">
                        Os serviços são fornecidos "como estão" e "conforme disponíveis", sem garantias de qualquer tipo.
                      </p>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300">11.1. Isenção de Garantias</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Não garantimos que:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Os serviços serão ininterruptos, livres de erros ou 100% precisos</li>
                      <li>Resultados de IA serão sempre corretos ou completos</li>
                      <li>Defeitos serão corrigidos imediatamente</li>
                      <li>A plataforma estará sempre disponível</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">11.2. Limitação de Danos</h3>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                      <p className="text-blue-100/80 leading-relaxed">
                        Na extensão máxima permitida por lei, a MediAI não será responsável por:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4 mt-3">
                        <li>Danos indiretos, incidentais ou consequenciais</li>
                        <li>Perda de lucros, dados ou oportunidades</li>
                        <li>Decisões médicas baseadas em resultados da IA</li>
                        <li>Erros de diagnóstico ou tratamento inadequado</li>
                        <li>Danos resultantes de uso indevido da plataforma</li>
                      </ul>
                      <p className="text-blue-100/80 leading-relaxed mt-4">
                        Nossa responsabilidade total não excederá o valor pago por você nos últimos 12 meses.
                      </p>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">11.3. Decisões Médicas</h3>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                      <p className="text-blue-100/80 leading-relaxed">
                        A MediAI não se responsabiliza por decisões médicas tomadas com base em análises de IA. 
                        Sempre consulte profissionais de saúde licenciados para diagnósticos e tratamentos.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Privacidade */}
              <section id="privacidade">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4 flex items-center gap-3">
                      <Shield className="h-8 w-8" />
                      12. Privacidade e Proteção de Dados
                    </h2>

                    <p className="text-blue-100/80 leading-relaxed">
                      O tratamento de seus dados pessoais está detalhado em nossa{" "}
                      <Link href="/privacidade" className="text-cyan-400 hover:text-cyan-300 underline font-semibold">
                        Política de Privacidade
                      </Link>, que é parte integrante destes Termos de Uso.
                    </p>

                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mt-6">
                      <h3 className="font-semibold text-cyan-300 mb-3">Conformidade LGPD</h3>
                      <p className="text-blue-100/80 leading-relaxed mb-3">
                        Estamos em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                        <li>Você possui direitos sobre seus dados (acesso, correção, exclusão, portabilidade)</li>
                        <li>Dados médicos são protegidos com segurança adicional</li>
                        <li>Compartilhamento com terceiros é transparente e limitado</li>
                        <li>Você pode exercer seus direitos através do DPO: <a href="mailto:dpo@appmediai.com" className="text-cyan-400 hover:text-cyan-300">dpo@appmediai.com</a></li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Modificações */}
              <section id="modificacoes">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">13. Modificações nos Termos</h2>

                    <p className="text-blue-100/80 leading-relaxed">
                      Podemos atualizar estes Termos de Uso periodicamente. Alterações significativas serão notificadas:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Por email cadastrado</li>
                      <li>Através de aviso na plataforma</li>
                      <li>Com 30 dias de antecedência para alterações materiais</li>
                    </ul>

                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mt-6">
                      <p className="text-blue-100/80 leading-relaxed">
                        Uso contínuo após alterações constitui aceitação dos novos termos. Se não concordar, você 
                        deve cancelar sua conta antes da data de vigência.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Rescisão */}
              <section id="rescisao">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">14. Rescisão e Suspensão</h2>

                    <h3 className="text-xl font-semibold text-purple-300">14.1. Suspensão ou Encerramento pela MediAI</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Podemos suspender ou encerrar sua conta imediatamente, sem aviso prévio, se:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Você violar estes Termos de Uso</li>
                      <li>Houver suspeita de fraude ou atividade ilegal</li>
                      <li>Você fornecer informações falsas</li>
                      <li>Houver inadimplência de pagamento</li>
                      <li>Seu uso prejudicar outros usuários ou a plataforma</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">14.2. Efeitos da Rescisão</h3>
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                      <p className="text-blue-100/80 leading-relaxed mb-3">Após rescisão:</p>
                      <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                        <li>Acesso à plataforma será imediatamente revogado</li>
                        <li>Dados podem ser retidos conforme Política de Privacidade e legislação</li>
                        <li>Obrigações de pagamento permanecem para serviços já utilizados</li>
                        <li>Cláusulas de confidencialidade e propriedade intelectual permanecem em vigor</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Lei Aplicável */}
              <section id="lei-aplicavel">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">15. Lei Aplicável e Jurisdição</h2>

                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                      <p className="text-blue-100/80 leading-relaxed mb-4">
                        Estes Termos de Uso são regidos pelas leis da <strong className="text-cyan-300">República Federativa do Brasil</strong>, incluindo:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                        <li>Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)</li>
                        <li>Marco Civil da Internet (Lei 12.965/2014)</li>
                        <li>Código de Defesa do Consumidor (Lei 8.078/1990)</li>
                        <li>Legislação médica e regulamentações do CFM</li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">Foro Competente</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Fica eleito o foro da Comarca de <strong className="text-cyan-300">São Paulo, SP</strong>, com 
                      exclusão de qualquer outro, por mais privilegiado que seja, para dirimir quaisquer dúvidas ou 
                      controvérsias oriundas destes Termos.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Contato */}
              <section id="contato">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20 shadow-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">16. Contato</h2>

                    <p className="text-blue-100/80 leading-relaxed">
                      Para dúvidas, sugestões ou reclamações sobre estes Termos de Uso:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-cyan-300 mb-4">Contato Geral</h3>
                        <div className="space-y-2 text-blue-100/80 text-sm">
                          <p><strong>Email:</strong> <a href="mailto:contato@appmediai.com" className="text-cyan-400 hover:text-cyan-300">contato@appmediai.com</a></p>
                          <p><strong>Suporte:</strong> <a href="mailto:suporte@appmediai.com" className="text-cyan-400 hover:text-cyan-300">suporte@appmediai.com</a></p>
                          <p><strong>Telefone:</strong> (11) 4002-8922</p>
                        </div>
                      </div>

                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-purple-300 mb-4">Dados da Empresa</h3>
                        <div className="space-y-1 text-blue-100/80 text-sm">
                          <p><strong>Razão Social:</strong> MediAI Tecnologia em Saúde Ltda.</p>
                          <p><strong>CNPJ:</strong> XX.XXX.XXX/0001-XX</p>
                          <p><strong>Endereço:</strong> Av. Paulista, 1578 - 14º andar</p>
                          <p>Bela Vista, São Paulo - SP</p>
                          <p>CEP 01310-200</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Footer Info */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-8 text-center">
                <p className="text-blue-100/80 mb-4 leading-relaxed">
                  Ao usar a plataforma MediAI, você confirma que leu, compreendeu e concordou com estes Termos de Uso 
                  e com nossa Política de Privacidade.
                </p>
                <p className="text-sm text-blue-300/60">
                  Última atualização: {LAST_UPDATED}
                </p>
                <div className="flex justify-center gap-4 mt-6">
                  <Button asChild variant="outline" className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10">
                    <Link href="/privacidade">Ver Política de Privacidade</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10">
                    <Link href="/contato">Entrar em Contato</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative w-full border-t border-cyan-500/20 bg-gradient-to-b from-slate-950 to-black py-8">
        <div className="container px-4 md:px-6 text-center text-sm text-blue-200/50">
          <p>&copy; {new Date().getFullYear()} MediAI. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}