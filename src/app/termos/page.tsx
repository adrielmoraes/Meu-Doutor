"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import { FileText, AlertTriangle, Shield, CreditCard, ChevronRight, CheckCircle2, PhoneCall } from "lucide-react";

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
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      <Header />

      <main className="flex-1 relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/40 to-slate-50">
        {/* Hero Section */}
        <section className="relative w-full py-16 md:py-24 border-b border-slate-200">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-6xl">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-2 text-cyan-600 shadow-sm">
                <FileText className="h-8 w-8" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-cyan-900 tracking-tight">
                Termos de Uso
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Condições gerais e diretrizes legais para utilização da plataforma MediAI
              </p>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
                <span>Última atualização: {LAST_UPDATED}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="container px-4 md:px-6 py-12 mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sticky Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <CardContent className="p-5">
                    <h2 className="text-sm font-bold text-cyan-950 mb-3 flex items-center gap-2 uppercase tracking-wide">
                      <FileText className="h-4 w-4 text-cyan-600" />
                      Índice do Documento
                    </h2>
                    <nav className="space-y-1">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={`w-full text-left text-xs sm:text-sm py-2 px-3 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                            activeSection === section.id
                              ? "bg-cyan-50 text-cyan-900 font-bold border border-cyan-200 shadow-sm"
                              : "text-slate-700 hover:bg-slate-50 hover:text-cyan-950"
                          }`}
                        >
                          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-cyan-600" />
                          <span className="line-clamp-1">{section.title}</span>
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
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">1. Aceitação dos Termos</h2>
                    <p className="text-slate-700 leading-relaxed">
                      Ao acessar e utilizar a plataforma <strong className="text-cyan-950">MediAI</strong>, você 
                      (&quot;Usuário&quot;, &quot;você&quot;) concorda em ficar vinculado a estes Termos de Uso e à nossa Política de Privacidade.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      Se você não concordar com qualquer parte destes termos, não utilize nossa plataforma.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-6">
                      <p className="text-amber-950 font-bold mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        LEIA COM ATENÇÃO
                      </p>
                      <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                        Ao criar uma conta ou usar nossos serviços, você confirma que leu, compreendeu e concordou com estes 
                        Termos de Uso e com nossa Política de Privacidade.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Definições */}
              <section id="definicoes">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">2. Definições</h2>
                    <div className="space-y-3">
                      <div className="bg-slate-50 border-l-4 border-cyan-500 p-4 rounded-r-xl border border-slate-200">
                        <p className="text-slate-700">
                          <strong className="text-cyan-950 font-bold">Plataforma:</strong> Sistema online MediAI acessível via web e aplicativos.
                        </p>
                      </div>
                      <div className="bg-slate-50 border-l-4 border-cyan-500 p-4 rounded-r-xl border border-slate-200">
                        <p className="text-slate-700">
                          <strong className="text-cyan-950 font-bold">Serviços:</strong> Análise de exames por IA, teleconsultas virtuais, monitoramento de saúde e acompanhamento médico.
                        </p>
                      </div>
                      <div className="bg-slate-50 border-l-4 border-cyan-500 p-4 rounded-r-xl border border-slate-200">
                        <p className="text-slate-700">
                          <strong className="text-cyan-950 font-bold">IA Médica:</strong> Sistemas de inteligência artificial especializados em análise médica como copiloto (não substituem consultas médicas presenciais).
                        </p>
                      </div>
                      <div className="bg-slate-50 border-l-4 border-cyan-500 p-4 rounded-r-xl border border-slate-200">
                        <p className="text-slate-700">
                          <strong className="text-cyan-950 font-bold">Usuário:</strong> Pessoa física ou jurídica que utiliza a Plataforma (paciente, médico ou parceiro institucional).
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Descrição dos Serviços */}
              <section id="descricao-servicos">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">3. Descrição dos Serviços</h2>
                    <p className="text-slate-700 leading-relaxed">
                      A MediAI é uma plataforma de saúde assistida por inteligência artificial que oferece:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li><strong className="text-cyan-950">Análise de Exames por IA:</strong> Upload de laudos e exames analisados por 25+ especialistas virtuais.</li>
                      <li><strong className="text-cyan-950">Consultas Virtuais ao Vivo:</strong> Atendimento com assistente Dra. Sofia e médicos reais credenciados no CRM.</li>
                      <li><strong className="text-cyan-950">Diagnósticos Preliminares:</strong> Triagem e orientações médicas iniciais em 30 segundos.</li>
                      <li><strong className="text-cyan-950">Monitoramento e Histórico:</strong> Armazenamento estruturado e seguro de exames em nuvem com conformidade LGPD.</li>
                      <li><strong className="text-cyan-950">Podcast de Saúde:</strong> Síntese sonora em linguagem simples sobre a evolução clínica do paciente.</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* Disclaimers Médicos - SEÇÃO CRÍTICA (ALTO CONTRASTE CLARO) */}
              <section id="disclaimers-medicos">
                <Card className="bg-rose-50/70 border-2 border-rose-200 rounded-3xl shadow-md">
                  <CardContent className="p-8 space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-950 flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-rose-600 shrink-0" />
                      4. Disclaimers Médicos Importantes
                    </h2>

                    <div className="bg-white border-2 border-rose-300 rounded-2xl p-6 shadow-sm">
                      <p className="text-rose-950 font-extrabold text-lg mb-2">
                        ⚠️ AVISO CRÍTICO: LEIA COM ATENÇÃO
                      </p>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        A INTELIGÊNCIA ARTIFICIAL DA MEDIAI NÃO SUBSTITUI, EM NENHUMA HIPÓTESE, A AVALIAÇÃO, 
                        DIAGNÓSTICO E TRATAMENTO POR MÉDICOS REAIS DEVIDAMENTE LICENCIADOS NO CRM.
                      </p>
                    </div>

                    <h3 className="text-xl font-bold text-rose-950">4.1. Limitações da IA Médica</h3>
                    <div className="space-y-3">
                      <div className="bg-white border border-rose-200 rounded-2xl p-4">
                        <p className="text-slate-700 leading-relaxed">
                          <strong className="text-rose-950 font-bold">Ferramenta de Triagem:</strong> Nossa IA é uma ferramenta de 
                          <strong> triagem, segunda opinião e apoio diagnóstico</strong>, não constituindo um diagnóstico médico final definitivo.
                        </p>
                      </div>
                      <div className="bg-white border border-rose-200 rounded-2xl p-4">
                        <p className="text-slate-700 leading-relaxed">
                          <strong className="text-rose-950 font-bold">Não é Substituto de Médico:</strong> A tecnologia não substitui exames físicos, consultas presenciais ou o julgamento clínico individualizado.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-rose-950">4.2. Emergências Médicas</h3>
                    <div className="bg-red-600 text-white rounded-2xl p-6 shadow-lg space-y-3">
                      <p className="font-extrabold text-lg flex items-center gap-2">
                        <PhoneCall className="h-5 w-5 shrink-0" />
                        🚨 A MEDIAI NÃO É UM SERVIÇO DE EMERGÊNCIA
                      </p>
                      <p className="text-red-100 text-sm sm:text-base leading-relaxed">
                        Em caso de sintomas agudos e graves (dor torácica, falta de ar severa, sangramento intenso, perda de consciência), procure atendimento médico imediato ou acione:
                      </p>
                      <div className="bg-red-800/80 rounded-xl p-3 text-center font-bold text-lg sm:text-xl">
                        SAMU: 192 | Bombeiros: 193 | Emergência: 190
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Cadastro */}
              <section id="cadastro">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">5. Cadastro e Conta</h2>

                    <h3 className="text-xl font-bold text-cyan-900">5.1. Requisitos de Cadastro</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li>Você deve ter pelo menos 18 anos ou estar representado por responsável legal</li>
                      <li>Fornecer dados cadastrais verídicos, exatos e atualizados</li>
                      <li>Aceitar nossa Política de Privacidade e concordar com a LGPD</li>
                    </ul>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">5.2. Segurança da Conta</h3>
                    <div className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-6">
                      <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 text-sm sm:text-base">
                        <li>Você é responsável por manter a confidencialidade de sua senha</li>
                        <li>Não compartilhe suas credenciais com terceiros</li>
                        <li>Notifique nosso suporte imediatamente ao suspeitar de acesso indevido</li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">5.3. Contas Médicas (CRM)</h3>
                    <p className="text-slate-700 leading-relaxed">
                      Médicos devem apresentar CRM ativo e regular no estado de atuação. A MediAI valida credenciais antes de liberar o painel médico.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Responsabilidades do Usuário */}
              <section id="responsabilidades-usuario">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">6. Responsabilidades do Usuário</h2>

                    <h3 className="text-xl font-bold text-cyan-900">6.1. Uso Adequado</h3>
                    <p className="text-slate-700 leading-relaxed">Você concorda em:</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li>Utilizar os serviços exclusivamente para finalidades lícitas e de cuidado à saúde</li>
                      <li>Fornecer exames e informações fidedignas para possibilitar análises precisas</li>
                      <li>Não tentar burlar mecanismos de autenticação e proteção do sistema</li>
                    </ul>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">6.2. Condutas Proibidas</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                      <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 text-sm sm:text-base">
                        <li>Fazer engenharia reversa ou copiar os modelos e algoritmos da plataforma</li>
                        <li>Realizar extração automatizada de dados (scraping)</li>
                        <li>Utilizar a plataforma para emissão fraudulenta de documentos médicos</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Responsabilidades da Plataforma */}
              <section id="responsabilidades-plataforma">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">7. Responsabilidades da Plataforma</h2>

                    <p className="text-slate-700 leading-relaxed">
                      Nos comprometemos a manter elevados padrões de segurança e estabilidade, operando em conformidade com as diretrizes do CFM, ANS e LGPD.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Assinaturas e Pagamentos */}
              <section id="assinaturas">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4 flex items-center gap-3">
                      <CreditCard className="h-8 w-8 text-cyan-600" />
                      8. Assinaturas e Pagamentos
                    </h2>

                    <h3 className="text-xl font-bold text-cyan-900">8.1. Planos e Preços</h3>
                    <p className="text-slate-700 leading-relaxed">
                      Oferecemos planos de teste grátis (5 dias) e assinaturas recorrentes. Todos os preços e funcionalidades estão transparentemente descritos na página de Planos e Preços.
                    </p>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">8.2. Segurança nos Pagamentos</h3>
                    <div className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-6">
                      <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 text-sm sm:text-base">
                        <li>Pagamentos criptografados por processadores certificados PCI-DSS</li>
                        <li>Não armazenamos números completos de cartão em nossos servidores</li>
                        <li>Cobranças em moeda corrente nacional (BRL)</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Cancelamento e Reembolso */}
              <section id="cancelamento">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">9. Cancelamento e Reembolso</h2>

                    <h3 className="text-xl font-bold text-cyan-900">9.1. Direito de Arrependimento (CDC)</h3>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                      <p className="text-emerald-950 font-bold mb-1">Garantia Legal de 7 Dias</p>
                      <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                        Conforme o Art. 49 do Código de Defesa do Consumidor, você possui o direito de cancelar a assinatura em até <strong>7 dias corridos</strong> após a contratação com reembolso integral.
                      </p>
                    </div>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">9.2. Cancelamento Digital</h3>
                    <p className="text-slate-700 leading-relaxed">
                      Você pode cancelar sua renovação a qualquer momento diretamente nas configurações da sua conta, sem cobrança de multas.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Propriedade Intelectual */}
              <section id="propriedade-intelectual">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">10. Propriedade Intelectual</h2>

                    <p className="text-slate-700 leading-relaxed">
                      Todos os softwares, marcas, modelos de inteligência artificial e interfaces da MediAI são protegidos pelas leis de propriedade intelectual. Você mantém a titularidade integral dos seus exames e dados médicos enviados.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Limitações de Responsabilidade */}
              <section id="limitacoes">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">11. Limitações de Responsabilidade</h2>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                      <p className="text-amber-950 font-bold mb-2">Orientações Informativas</p>
                      <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                        A MediAI fornece análises preliminares e tecnológicas de suporte. O usuário deve sempre validar qualquer conduta de saúde com um médico licenciado.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Privacidade */}
              <section id="privacidade">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4 flex items-center gap-3">
                      <Shield className="h-8 w-8 text-cyan-600" />
                      12. Privacidade e Proteção de Dados
                    </h2>

                    <p className="text-slate-700 leading-relaxed">
                      O tratamento de dados pessoais é regulado por nossa{" "}
                      <Link href="/privacidade" className="text-cyan-700 hover:text-cyan-800 underline font-bold">
                        Política de Privacidade
                      </Link>, elaborada sob rigoroso cumprimento da LGPD.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Modificações */}
              <section id="modificacoes">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">13. Modificações nos Termos</h2>

                    <p className="text-slate-700 leading-relaxed">
                      Estes Termos podem ser atualizados periodicamente. Alterações substanciais serão comunicadas na plataforma e por e-mail com antecedência.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Rescisão */}
              <section id="rescisao">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">14. Rescisão e Suspensão</h2>

                    <p className="text-slate-700 leading-relaxed">
                      Reservamo-nos o direito de suspender contas que violem estes termos, cometam fraudes ou utilizem a plataforma de forma ilícita.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Lei Aplicável */}
              <section id="lei-aplicavel">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">15. Lei Aplicável e Jurisdição</h2>

                    <p className="text-slate-700 leading-relaxed">
                      Estes Termos de Uso são regidos pela legislação da República Federativa do Brasil. Fica eleito o foro da Comarca de Belém, PA, para dirimir quaisquer litígios oriundos deste contrato.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Contato */}
              <section id="contato">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-2">16. Canal de Atendimento</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-6 space-y-2 text-slate-700 text-sm">
                        <h3 className="font-bold text-cyan-950 text-base">Contato Oficial</h3>
                        <p><strong>E-mail:</strong> <a href="mailto:contato@appmediai.com" className="text-cyan-700 hover:text-cyan-800 font-bold underline">contato@appmediai.com</a></p>
                        <p><strong>Suporte:</strong> <a href="mailto:suporte@appmediai.com" className="text-cyan-700 hover:text-cyan-800 font-bold underline">suporte@appmediai.com</a></p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-2 text-slate-700 text-sm">
                        <h3 className="font-bold text-cyan-950 text-base">Institucional</h3>
                        <p><strong>Razão Social:</strong> MediAI Tecnologia em Saúde Ltda.</p>
                        <p><strong>Endereço:</strong> Rd. Arthur Bernardes, Pss Novo Continente - nº 34A, Belém - PA</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Action Footer */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-4">
                <p className="text-slate-700 leading-relaxed max-w-2xl mx-auto text-sm sm:text-base">
                  Ao usar a plataforma MediAI, você confirma que leu, compreendeu e concordou com estes Termos de Uso e nossa Política de Privacidade.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <Button asChild variant="outline" className="border-2 border-slate-300 text-slate-800 hover:bg-cyan-50 hover:text-cyan-950 hover:border-cyan-400 font-bold bg-white rounded-xl">
                    <Link href="/privacidade">Ver Política de Privacidade</Link>
                  </Button>
                  <Button asChild className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-500/20 border-0 rounded-xl">
                    <Link href="/contato">Fale Conosco</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-200 bg-white py-8">
        <div className="container px-4 md:px-6 mx-auto text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} MediAI Saúde Inteligente. Todos os direitos reservados.</p>
          <p className="text-xs text-cyan-800 font-semibold mt-1">Em conformidade com a LGPD e diretrizes do CFM.</p>
        </div>
      </footer>
    </div>
  );
}
