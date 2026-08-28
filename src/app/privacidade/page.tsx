"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import { Shield, Lock, FileText, Mail, ChevronRight } from "lucide-react";

const LAST_UPDATED = "29 de outubro de 2025";

export default function PrivacidadePage() {
  const [activeSection, setActiveSection] = useState("");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const sections = [
    { id: "introducao", title: "1. Introdução e Escopo" },
    { id: "dados-coletados", title: "2. Dados Coletados" },
    { id: "base-legal", title: "3. Base Legal para Processamento" },
    { id: "uso-dados", title: "4. Como Usamos os Dados" },
    { id: "compartilhamento", title: "5. Compartilhamento com Terceiros" },
    { id: "direitos-titulares", title: "6. Direitos dos Titulares" },
    { id: "retencao", title: "7. Retenção de Dados" },
    { id: "seguranca", title: "8. Segurança e Proteção" },
    { id: "cookies", title: "9. Cookies e Rastreamento" },
    { id: "menores", title: "10. Dados de Menores" },
    { id: "transferencia", title: "11. Transferência Internacional" },
    { id: "alteracoes", title: "12. Alterações na Política" },
    { id: "contato", title: "13. Contato e DPO" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-[#070e24] to-slate-950 text-white">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-16 md:py-24 overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-cyan-400" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
                Política de Privacidade
              </h1>
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Conformidade total com a LGPD e máxima segurança para seus dados de saúde
              </p>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
                <span>Última atualização: {LAST_UPDATED}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="container px-4 md:px-6 py-12">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sticky Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-xl">
                  <CardContent className="p-5">
                    <h2 className="text-base font-bold text-cyan-300 mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Índice da Política
                    </h2>
                    <nav className="space-y-1.5">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={`w-full text-left text-xs sm:text-sm py-2 px-3 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                            activeSection === section.id
                              ? "bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
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
              {/* Introduction */}
              <section id="introducao">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">1. Introdução e Escopo</h2>
                    <p className="text-blue-100/80 leading-relaxed">
                      A <strong className="text-cyan-300">MediAI Tecnologia em Saúde Ltda.</strong> (&quot;MediAI&quot;, &quot;nós&quot;, &quot;nosso&quot;) 
                      está comprometida com a proteção da privacidade e dos dados pessoais de todos os usuários de nossa plataforma.
                    </p>
                    <p className="text-blue-100/80 leading-relaxed">
                      Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos 
                      suas informações pessoais e dados médicos sensíveis, em total conformidade com:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li><strong className="text-cyan-300">Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)</strong></li>
                      <li>Marco Civil da Internet (Lei 12.965/2014)</li>
                      <li>Código de Defesa do Consumidor (Lei 8.078/1990)</li>
                      <li>Regulamentações do Conselho Federal de Medicina (CFM)</li>
                      <li>Normas da Agência Nacional de Saúde Suplementar (ANS)</li>
                    </ul>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mt-6">
                      <p className="text-blue-100 font-semibold mb-2">
                        ⚠️ IMPORTANTE: Dados Sensíveis de Saúde
                      </p>
                      <p className="text-blue-200/70 leading-relaxed">
                        Nossa plataforma processa dados pessoais sensíveis relacionados à saúde, incluindo exames médicos, 
                        diagnósticos, histórico clínico e informações sobre condições de saúde. Estes dados recebem proteção 
                        adicional conforme exigido pela LGPD (Art. 11).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Dados Coletados */}
              <section id="dados-coletados">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">2. Dados Coletados</h2>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">2.1. Dados Pessoais Básicos</h3>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Nome completo</li>
                      <li>CPF</li>
                      <li>Data de nascimento</li>
                      <li>Gênero</li>
                      <li>Endereço de email</li>
                      <li>Número de telefone</li>
                      <li>Endereço residencial</li>
                      <li>Foto de perfil (opcional)</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">2.2. Dados Sensíveis de Saúde</h3>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Exames médicos (sangue, imagem, laboratoriais)</li>
                      <li>Resultados de exames e laudos</li>
                      <li>Diagnósticos preliminares e finais</li>
                      <li>Histórico médico e condições de saúde</li>
                      <li>Alergias e medicamentos em uso</li>
                      <li>Sinais vitais e medições de saúde</li>
                      <li>Informações sobre tratamentos</li>
                      <li>Gravações de consultas (áudio/vídeo)</li>
                      <li>Transcrições de conversas com IA médica</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">2.3. Dados de Uso da Plataforma</h3>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Endereço IP</li>
                      <li>Tipo de dispositivo e navegador</li>
                      <li>Sistema operacional</li>
                      <li>Páginas visitadas e tempo de navegação</li>
                      <li>Interações com a plataforma</li>
                      <li>Logs de acesso e atividades</li>
                      <li>Preferências e configurações</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">2.4. Dados Financeiros</h3>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Informações de assinatura e plano</li>
                      <li>Histórico de pagamentos</li>
                      <li>Dados de cartão de crédito (processados e armazenados exclusivamente por processadores de pagamento certificados)</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* Base Legal */}
              <section id="base-legal">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">3. Base Legal para Processamento</h2>
                    <p className="text-blue-100/80 leading-relaxed">
                      Processamos seus dados pessoais com base nas seguintes bases legais previstas na LGPD:
                    </p>

                    <div className="space-y-4 mt-4">
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-purple-300 mb-2">Consentimento (Art. 7º, I)</h3>
                        <p className="text-blue-200/70">
                          Você fornece consentimento explícito e informado ao criar sua conta e aceitar esta Política de Privacidade. 
                          Você pode revogar seu consentimento a qualquer momento.
                        </p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-emerald-300 mb-2">Execução de Contrato (Art. 7º, V)</h3>
                        <p className="text-blue-200/70">
                          O processamento de dados é necessário para execução de contrato (nossos Termos de Uso) e para 
                          fornecimento dos serviços de análise médica por IA e consultas.
                        </p>
                      </div>

                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-cyan-300 mb-2">Tutela da Saúde (Art. 11, II, f)</h3>
                        <p className="text-blue-200/70">
                          Dados sensíveis de saúde são processados para tutela da saúde, exclusivamente por profissionais de saúde 
                          e sistemas de IA médica certificados, ou para realização de diagnósticos assistidos por IA.
                        </p>
                      </div>

                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-orange-300 mb-2">Obrigação Legal (Art. 7º, II)</h3>
                        <p className="text-blue-200/70">
                          Cumprimento de obrigações legais e regulatórias, incluindo requisitos do CFM, ANS e autoridades sanitárias.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Uso dos Dados */}
              <section id="uso-dados">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">4. Como Usamos os Dados</h2>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">4.1. Análises Médicas por IA</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Seus exames médicos e dados de saúde são processados por nossos 15 especialistas de IA 
                      (cardiologista, neurologista, dermatologista, etc.) utilizando <strong className="text-cyan-300">modelos de inteligência artificial avançados</strong> para:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Gerar diagnósticos preliminares</li>
                      <li>Identificar padrões e anomalias em exames</li>
                      <li>Fornecer segunda opinião médica assistida por IA</li>
                      <li>Recomendar especialistas adequados</li>
                      <li>Avaliar urgência e triagem</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">4.2. Consultas ao Vivo</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Utilizamos <strong className="text-cyan-300">infraestrutura de comunicação em tempo real</strong> para consultas por vídeo e voz com:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Assistentes médicos virtuais alimentados por IA</li>
                      <li>Médicos reais credenciados no CRM</li>
                      <li>Gravação de consultas (com seu consentimento explícito)</li>
                      <li>Transcrição automática para registro médico</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">4.3. Avatares Conversacionais</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Utilizamos <strong className="text-cyan-300">tecnologias de avatares virtuais</strong> para:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Criar interações naturais e humanizadas</li>
                      <li>Assistentes virtuais com expressões faciais</li>
                      <li>Melhorar experiência de consulta virtual</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">4.4. Outros Usos</h3>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li>Melhorar e personalizar nossos serviços</li>
                      <li>Enviar notificações sobre sua saúde e lembretes</li>
                      <li>Gerar planos de bem-estar personalizados</li>
                      <li>Realizar pesquisas científicas (dados anonimizados)</li>
                      <li>Cumprir obrigações legais e regulatórias</li>
                      <li>Prevenir fraudes e garantir segurança</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* Compartilhamento */}
              <section id="compartilhamento">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">5. Compartilhamento com Terceiros</h2>

                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-6">
                      <p className="text-orange-300 font-semibold mb-2">⚠️ Princípio de Minimização</p>
                      <p className="text-blue-200/70">
                        Compartilhamos apenas os dados estritamente necessários com terceiros de confiança que nos ajudam a 
                        fornecer nossos serviços. Todos os parceiros estão contratualmente obrigados a proteger seus dados.
                      </p>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">5.1. Categorias de Terceiros</h3>
                    <p className="text-blue-100/80 leading-relaxed mb-4">
                      Compartilhamos seus dados com as seguintes categorias de prestadores de serviços:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                      <li><strong className="text-cyan-300">Provedores de Inteligência Artificial:</strong> Para análise médica, diagnósticos preliminares e processamento de linguagem natural</li>
                      <li><strong className="text-cyan-300">Serviços de Comunicação em Tempo Real:</strong> Para consultas por vídeo e áudio</li>
                      <li><strong className="text-cyan-300">Provedores de Avatares Virtuais:</strong> Para consultas com assistentes virtuais</li>
                      <li><strong className="text-cyan-300">Processadores de Pagamento:</strong> Para transações financeiras e assinaturas</li>
                      <li><strong className="text-cyan-300">Provedores de Infraestrutura em Nuvem:</strong> Para armazenamento seguro de dados</li>
                      <li><strong className="text-cyan-300">Serviços de Email Transacional:</strong> Para notificações e comunicações</li>
                    </ul>

                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mt-6">
                      <p className="text-blue-100 font-semibold mb-2">
                        📋 Lista Completa de Terceiros
                      </p>
                      <p className="text-blue-200/70 leading-relaxed">
                        Conforme Art. 18, VII da LGPD, você tem direito de requisitar a lista completa 
                        com nomes específicos de todas as empresas terceiras. Para solicitar, entre em 
                        contato com nosso DPO: <a href="mailto:dpo@appmediai.com" className="text-cyan-300 hover:underline">dpo@appmediai.com</a>
                      </p>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">5.2. Médicos e Profissionais de Saúde</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Compartilhamos seus dados médicos com médicos credenciados no CRM quando você agenda consultas 
                      ou quando a IA recomenda avaliação por profissional humano.
                    </p>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">5.3. Autoridades Legais</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Podemos divulgar dados pessoais quando legalmente obrigados (ordem judicial, intimação) ou para 
                      proteger direitos, propriedade e segurança da MediAI, usuários ou público.
                    </p>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">5.4. Pesquisa Científica</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Podemos usar dados <strong>totalmente anonimizados</strong> para pesquisas científicas e médicas, 
                      sem qualquer possibilidade de identificação individual.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Direitos dos Titulares */}
              <section id="direitos-titulares">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">6. Direitos dos Titulares de Dados</h2>
                    <p className="text-blue-100/80 leading-relaxed">
                      Conforme a LGPD (Arts. 17-22), você possui os seguintes direitos sobre seus dados pessoais:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-cyan-300 mb-2">✓ Confirmação e Acesso</h3>
                        <p className="text-blue-200/70 text-sm">
                          Confirmar a existência de tratamento e acessar todos os seus dados armazenados.
                        </p>
                      </div>

                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-purple-300 mb-2">✓ Correção</h3>
                        <p className="text-blue-200/70 text-sm">
                          Corrigir dados incompletos, inexatos ou desatualizados.
                        </p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-emerald-300 mb-2">✓ Anonimização/Bloqueio</h3>
                        <p className="text-blue-200/70 text-sm">
                          Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.
                        </p>
                      </div>

                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-orange-300 mb-2">✓ Portabilidade</h3>
                        <p className="text-blue-200/70 text-sm">
                          Receber seus dados em formato estruturado e interoperável (JSON, PDF).
                        </p>
                      </div>

                      <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-pink-300 mb-2">✓ Eliminação</h3>
                        <p className="text-blue-200/70 text-sm">
                          Excluir dados tratados com base no consentimento (exceto dados que devemos manter por lei).
                        </p>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-blue-300 mb-2">✓ Informação sobre Compartilhamento</h3>
                        <p className="text-blue-200/70 text-sm">
                          Saber com quem compartilhamos seus dados.
                        </p>
                      </div>

                      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-indigo-300 mb-2">✓ Revogação de Consentimento</h3>
                        <p className="text-blue-200/70 text-sm">
                          Revogar consentimento a qualquer momento (pode limitar funcionalidades).
                        </p>
                      </div>

                      <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-teal-300 mb-2">✓ Oposição</h3>
                        <p className="text-blue-200/70 text-sm">
                          Opor-se a tratamento realizado sem consentimento, nas hipóteses permitidas pela LGPD.
                        </p>
                      </div>
                    </div>

                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mt-6">
                      <h3 className="font-semibold text-cyan-300 mb-2">Como Exercer seus Direitos:</h3>
                      <p className="text-blue-200/70 mb-4">
                        Para exercer qualquer destes direitos, entre em contato com nosso DPO:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-blue-100/80 ml-4">
                        <li>Email: <a href="mailto:dpo@appmediai.com" className="text-cyan-400 hover:text-cyan-300">dpo@appmediai.com</a></li>
                        <li>Através das configurações da sua conta na plataforma</li>
                        <li>Responderemos em até <strong>15 dias úteis</strong></li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Retenção */}
              <section id="retencao">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">7. Retenção de Dados</h2>

                    <div className="space-y-4">
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-purple-300 mb-2">Dados Médicos</h3>
                        <p className="text-blue-200/70">
                          Retidos por <strong>20 anos</strong> conforme Resolução CFM nº 1.821/2007 e legislação médica brasileira, 
                          mesmo após cancelamento da conta.
                        </p>
                      </div>

                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-cyan-300 mb-2">Dados de Conta e Cadastro</h3>
                        <p className="text-blue-200/70">
                          Retidos enquanto a conta estiver ativa. Após exclusão de conta, mantidos por até 
                          <strong> 5 anos</strong> para cumprimento de obrigações legais, fiscais e trabalhistas.
                        </p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-emerald-300 mb-2">Dados Financeiros</h3>
                        <p className="text-blue-200/70">
                          Retidos por <strong>5 anos</strong> conforme legislação fiscal e tributária brasileira.
                        </p>
                      </div>

                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-orange-300 mb-2">Logs de Acesso</h3>
                        <p className="text-blue-200/70">
                          Retidos por <strong>6 meses</strong> conforme Marco Civil da Internet.
                        </p>
                      </div>
                    </div>

                    <p className="text-blue-100/80 leading-relaxed mt-6">
                      Após os períodos de retenção, os dados são permanentemente excluídos de nossos sistemas e backups, 
                      exceto quando a lei exigir retenção por período maior.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Segurança */}
              <section id="seguranca">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4 flex items-center gap-3">
                      <Lock className="h-8 w-8" />
                      8. Segurança e Proteção
                    </h2>

                    <p className="text-blue-100/80 leading-relaxed">
                      Implementamos medidas técnicas e organizacionais robustas para proteger seus dados:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-cyan-300 mb-2">🔐 Criptografia</h3>
                        <ul className="list-disc list-inside space-y-1 text-blue-200/70 text-sm ml-4">
                          <li>TLS/SSL para dados em trânsito</li>
                          <li>AES-256 para dados em repouso</li>
                          <li>Criptografia end-to-end em consultas</li>
                        </ul>
                      </div>

                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-purple-300 mb-2">🔑 Controle de Acesso</h3>
                        <ul className="list-disc list-inside space-y-1 text-blue-200/70 text-sm ml-4">
                          <li>Autenticação multifator (MFA)</li>
                          <li>Princípio do menor privilégio</li>
                          <li>Logs de auditoria de acessos</li>
                        </ul>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-emerald-300 mb-2">🛡️ Infraestrutura</h3>
                        <ul className="list-disc list-inside space-y-1 text-blue-200/70 text-sm ml-4">
                          <li>Servidores em data centers certificados</li>
                          <li>Firewalls e proteção DDoS</li>
                          <li>Backups criptografados regulares</li>
                        </ul>
                      </div>

                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-orange-300 mb-2">👥 Controles Organizacionais</h3>
                        <ul className="list-disc list-inside space-y-1 text-blue-200/70 text-sm ml-4">
                          <li>Treinamento de equipe em LGPD</li>
                          <li>Acordos de confidencialidade</li>
                          <li>Testes de segurança regulares</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mt-6">
                      <h3 className="font-semibold text-orange-300 mb-2">⚠️ Notificação de Incidentes</h3>
                      <p className="text-blue-200/70">
                        Em caso de incidente de segurança que possa causar risco aos seus direitos e liberdades, 
                        notificaremos você e a ANPD conforme Art. 48 da LGPD, dentro do prazo legal.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Cookies */}
              <section id="cookies">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">9. Cookies e Tecnologias de Rastreamento</h2>

                    <p className="text-blue-100/80 leading-relaxed">
                      Utilizamos cookies e tecnologias similares para melhorar sua experiência:
                    </p>

                    <div className="space-y-4 mt-6">
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-cyan-300 mb-2">Cookies Essenciais (Necessários)</h3>
                        <p className="text-blue-200/70 text-sm">
                          Necessários para funcionamento básico da plataforma (autenticação, sessão, segurança). 
                          Não podem ser desativados.
                        </p>
                      </div>

                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-purple-300 mb-2">Cookies de Funcionalidade</h3>
                        <p className="text-blue-200/70 text-sm">
                          Lembram suas preferências e configurações (idioma, tema, configurações de privacidade).
                        </p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-emerald-300 mb-2">Cookies de Desempenho</h3>
                        <p className="text-blue-200/70 text-sm">
                          Coletam informações sobre como você usa a plataforma para melhorar performance (dados agregados).
                        </p>
                      </div>

                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                        <h3 className="font-semibold text-orange-300 mb-2">Cookies de Terceiros</h3>
                        <p className="text-blue-200/70 text-sm">
                          Ferramentas de analytics, processadores de pagamento e outros parceiros podem utilizar cookies. Consulte suas políticas de privacidade.
                        </p>
                      </div>
                    </div>

                    <p className="text-blue-100/80 leading-relaxed mt-6">
                      Você pode gerenciar cookies através das configurações do seu navegador. Note que desativar cookies 
                      essenciais pode prejudicar funcionalidades da plataforma.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Menores */}
              <section id="menores">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">10. Dados de Crianças e Adolescentes</h2>

                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-6">
                      <p className="text-orange-300 font-semibold mb-2">⚠️ Proteção Especial</p>
                      <p className="text-blue-200/70">
                        O tratamento de dados de menores de idade segue as normas do ECA (Estatuto da Criança e do Adolescente) 
                        e Art. 14 da LGPD.
                      </p>
                    </div>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">Menores de 18 anos</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      O uso da plataforma por menores de 18 anos requer <strong className="text-cyan-300">consentimento 
                      expresso de pelo menos um dos pais ou responsável legal</strong>. Os dados de menores recebem 
                      proteção adicional e não são utilizados para marketing ou pesquisas sem consentimento específico.
                    </p>

                    <h3 className="text-xl font-semibold text-purple-300 mt-6">Consultas Pediátricas</h3>
                    <p className="text-blue-100/80 leading-relaxed">
                      Para consultas pediátricas, o responsável legal deve estar presente e fornecer consentimento para 
                      gravação e análise dos dados médicos da criança.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Transferência Internacional */}
              <section id="transferencia">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">11. Transferência Internacional de Dados</h2>

                    <p className="text-blue-100/80 leading-relaxed">
                      Alguns de nossos fornecedores de tecnologia podem processar dados em servidores localizados fora do Brasil 
                      (incluindo provedores de IA, comunicação em tempo real, avatares virtuais, pagamentos e infraestrutura em nuvem).
                    </p>

                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mt-6">
                      <h3 className="font-semibold text-cyan-300 mb-2">Garantias Implementadas</h3>
                      <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                        <li>Transferências apenas para países com nível adequado de proteção de dados</li>
                        <li>Cláusulas contratuais padrão aprovadas pela ANPD</li>
                        <li>Certificações internacionais de segurança e privacidade</li>
                        <li>Garantias de que os dados manterão o mesmo nível de proteção da LGPD</li>
                        <li>Você tem direito de obter informações sobre as garantias implementadas</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Alterações */}
              <section id="alteracoes">
                <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-3xl font-bold text-cyan-300 mb-4">12. Alterações nesta Política</h2>

                    <p className="text-blue-100/80 leading-relaxed">
                      Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas 
                      práticas, legislação ou serviços.
                    </p>

                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mt-6">
                        <h3 className="font-semibold text-purple-300 mb-2">Notificação de Alterações</h3>
                        <ul className="list-disc list-inside space-y-2 text-blue-100/80 ml-4">
                          <li>Alterações significativas serão notificadas por email</li>
                          <li>Alterações menores serão publicadas na plataforma</li>
                          <li>Data da última atualização sempre visível no topo da política</li>
                          <li>Versões anteriores disponíveis mediante solicitação</li>
                          <li>Uso contínuo após alterações constitui aceitação das mudanças</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* DPO / Encarregado */}
                <section id="dpo">
                  <Card className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl">
                    <CardContent className="p-8 space-y-4">
                      <h2 className="text-3xl font-bold text-cyan-300 mb-4 flex items-center gap-3">
                        <Mail className="h-8 w-8" />
                        13. Encarregado de Proteção de Dados (DPO) e Contato
                      </h2>

                      <p className="text-slate-300 leading-relaxed">
                        Em cumprimento ao Art. 41 da LGPD, a MediAI nomeou um Encarregado de Proteção de Dados (DPO) 
                        para atuar como canal de comunicação entre a empresa, os titulares dos dados e a Autoridade Nacional 
                        de Proteção de Dados (ANPD).
                      </p>

                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6">
                          <h3 className="font-semibold text-cyan-300 mb-4">Canal do Titular (DPO)</h3>
                          <div className="space-y-2 text-slate-300 text-sm">
                            <p><strong>Encarregado:</strong> DPO MediAI</p>
                            <p><strong>Email direto:</strong> <a href="mailto:privacidade@appmediai.com" className="text-cyan-400 hover:text-cyan-300">privacidade@appmediai.com</a></p>
                            <p><strong>Prazo de resposta:</strong> Até 15 dias úteis</p>
                          </div>
                        </div>

                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6">
                          <h3 className="font-semibold text-purple-300 mb-4">Informações do Controlador</h3>
                          <div className="space-y-1 text-slate-300 text-sm">
                            <p><strong>Razão Social:</strong> MediAI Tecnologia em Saúde Ltda.</p>
                            <p><strong>CNPJ:</strong> XX.XXX.XXX/0001-XX</p>
                            <p><strong>Endereço:</strong> Rd. Arthur Bernardes, Pss Novo Continente - nº 34A</p>
                            <p>Belém - PA</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
                        <h3 className="font-semibold text-white mb-2">Autoridade Nacional de Proteção de Dados (ANPD)</h3>
                        <p className="text-slate-400 text-sm">
                          Você também pode entrar em contato com a ANPD para questões relacionadas à proteção de dados:
                          <br />
                          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                            www.gov.br/anpd
                          </a>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Footer Info */}
                <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl shadow-xl">
                  <p className="text-slate-300 mb-4 leading-relaxed max-w-2xl mx-auto text-sm">
                    Esta Política de Privacidade foi elaborada em estrita conformidade com a Lei Geral de Proteção de Dados 
                    (Lei nº 13.709/2018) e legislação brasileira aplicável.
                  </p>
                  <p className="text-xs text-slate-500">
                    Última atualização: {LAST_UPDATED}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 mt-6">
                    <Button asChild variant="outline" className="border-white/10 text-slate-200 hover:text-white hover:bg-white/10 bg-slate-900/50 rounded-xl">
                      <Link href="/termos">Ver Termos de Uso</Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-cyan-500/20 border-0 rounded-xl">
                      <Link href="/contato">Entrar em Contato</Link>
                    </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative w-full border-t border-white/10 bg-slate-950 py-8">
        <div className="container px-4 md:px-6 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} MediAI. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
