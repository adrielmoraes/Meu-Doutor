"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import { Shield, Lock, FileText, Mail, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";

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
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      <Header />

      <main className="flex-1 relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/40 to-slate-50">
        {/* Hero Section */}
        <section className="relative w-full py-16 md:py-24 border-b border-slate-200">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-6xl">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-2 text-cyan-600 shadow-sm">
                <Shield className="h-8 w-8" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-cyan-900 tracking-tight">
                Política de Privacidade
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Conformidade total com a LGPD e máxima segurança para seus dados de saúde
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
                      Índice da Política
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
              {/* Introduction */}
              <section id="introducao">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">1. Introdução e Escopo</h2>
                    <p className="text-slate-700 leading-relaxed">
                      A <strong className="text-cyan-950">MediAI Tecnologia em Saúde Ltda.</strong> (&quot;MediAI&quot;, &quot;nós&quot;, &quot;nosso&quot;) 
                      está comprometida com a proteção da privacidade e dos dados pessoais de todos os usuários de nossa plataforma.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos 
                      suas informações pessoais e dados médicos sensíveis, em total conformidade com:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li><strong className="text-cyan-950">Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)</strong></li>
                      <li>Marco Civil da Internet (Lei 12.965/2014)</li>
                      <li>Código de Defesa do Consumidor (Lei 8.078/1990)</li>
                      <li>Regulamentações do Conselho Federal de Medicina (CFM)</li>
                      <li>Normas da Agência Nacional de Saúde Suplementar (ANS)</li>
                    </ul>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-6">
                      <p className="text-amber-950 font-bold mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        IMPORTANTE: Dados Sensíveis de Saúde
                      </p>
                      <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                        Nossa plataforma processa dados pessoais sensíveis relacionados à saúde, incluindo exames médicos, 
                        diagnósticos, histórico clínico e informações sobre condições de saúde. Estes dados recebem proteção 
                        adicional e rigorosa criptografia conforme exigido pela LGPD (Art. 11).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Dados Coletados */}
              <section id="dados-coletados">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">2. Dados Coletados</h2>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">2.1. Dados Pessoais Básicos</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li>Nome completo</li>
                      <li>CPF</li>
                      <li>Data de nascimento</li>
                      <li>Gênero</li>
                      <li>Endereço de e-mail</li>
                      <li>Número de telefone / WhatsApp</li>
                      <li>Endereço residencial e Cidade/UF</li>
                      <li>Foto de perfil (opcional)</li>
                    </ul>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">2.2. Dados Sensíveis de Saúde</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li>Exames médicos (sangue, imagem, laboratoriais)</li>
                      <li>Resultados de exames e laudos digitalizados</li>
                      <li>Diagnósticos preliminares e notas clínicas</li>
                      <li>Histórico médico e condições de saúde pré-existentes</li>
                      <li>Alergias e medicamentos de uso contínuo</li>
                      <li>Sinais vitais e medições informadas</li>
                      <li>Informações sobre tratamentos em andamento</li>
                      <li>Transcrições e registros de teleconsultas</li>
                    </ul>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">2.3. Dados de Uso da Plataforma</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li>Endereço IP e registros de data/hora de acesso</li>
                      <li>Tipo de dispositivo e navegador</li>
                      <li>Sistema operacional</li>
                      <li>Páginas visitadas e tempo de navegação</li>
                      <li>Interações com a assistente virtual e funcionalidades</li>
                    </ul>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">2.4. Dados Financeiros</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li>Informações do plano contratado</li>
                      <li>Histórico de faturamento e pagamentos</li>
                      <li>Dados de cartão de crédito (processados e armazenados com segurança por gateways certificados PCI-DSS)</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* Base Legal */}
              <section id="base-legal">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">3. Base Legal para Processamento</h2>
                    <p className="text-slate-700 leading-relaxed">
                      Processamos seus dados pessoais com base nas seguintes hipóteses legais previstas na LGPD:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-cyan-950 mb-2">Consentimento (Art. 7º, I)</h3>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          Você fornece consentimento explícito e informado ao criar sua conta e aceitar esta Política. 
                          Você pode revogar seu consentimento a qualquer momento nas configurações.
                        </p>
                      </div>

                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-emerald-950 mb-2">Execução de Contrato (Art. 7º, V)</h3>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          O processamento de dados é indispensável para execução dos nossos Termos de Uso e para 
                          o fornecimento dos serviços de análise médica por IA e consultas virtuais.
                        </p>
                      </div>

                      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-blue-950 mb-2">Tutela da Saúde (Art. 11, II, f)</h3>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          Dados sensíveis de saúde são processados exclusivamente para fins de tutela da saúde por 
                          sistemas de IA certificados e profissionais de saúde devidamente registrados.
                        </p>
                      </div>

                      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-amber-950 mb-2">Obrigação Legal (Art. 7º, II)</h3>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          Cumprimento de exigências legais e regulatórias sanitárias, incluindo resoluções do Conselho Federal de Medicina (CFM) e ANS.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Uso dos Dados */}
              <section id="uso-dados">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">4. Como Usamos os Dados</h2>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">4.1. Análises Médicas por IA</h3>
                    <p className="text-slate-700 leading-relaxed">
                      Seus exames médicos e dados de saúde são processados por nossos 25+ especialistas de IA 
                      (cardiologia, neurologia, dermatologia, etc.) utilizando <strong className="text-cyan-950">modelos de inteligência artificial clínica avançados</strong> para:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li>Gerar diagnósticos preliminares e resumos compreensíveis</li>
                      <li>Identificar padrões e desvios laboratoriais em exames</li>
                      <li>Fornecer segunda opinião e auxílio diagnóstico ao médico</li>
                      <li>Recomendar a especialidade adequada para atendimento presencial</li>
                      <li>Realizar triagem e avaliação de urgência</li>
                    </ul>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">4.2. Teleconsultas e Atendimento</h3>
                    <p className="text-slate-700 leading-relaxed">
                      Utilizamos <strong className="text-cyan-950">infraestrutura segura de comunicação em tempo real</strong> para consultas por vídeo e voz com:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li>Assistente virtual humanizada Dra. Sofia</li>
                      <li>Médicos reais credenciados e com CRM ativo</li>
                      <li>Registro de atendimento em prontuário eletrônico seguro</li>
                    </ul>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">4.3. Outras Finalidades</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li>Personalizar recomendações de hábitos saudáveis</li>
                      <li>Gerar podcasts personalizados explicativos sobre sua evolução de saúde</li>
                      <li>Enviar lembretes e notificações de saúde solicitadas</li>
                      <li>Garantir a segurança, prevenir fraudes e proteger nossa infraestrutura</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* Compartilhamento */}
              <section id="compartilhamento">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">5. Compartilhamento com Terceiros</h2>

                    <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6 mb-6">
                      <p className="text-cyan-950 font-bold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                        Princípio de Minimização e Sigilo
                      </p>
                      <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                        Compartilhamos apenas os dados estritamente necessários com provedores de tecnologia homologados. 
                        Todos os parceiros operam sob contratos com cláusulas rigorosas de confidencialidade e segurança alinhadas à LGPD.
                      </p>
                    </div>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">5.1. Categorias de Terceiros</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                      <li><strong className="text-cyan-950">Provedores de Nuvem e Servidores:</strong> Infraestrutura com certificações SOC 2 e ISO 27001 para armazenamento criptografado.</li>
                      <li><strong className="text-cyan-950">Processadores de Pagamento:</strong> Instituições de pagamento autorizadas pelo Banco Central para gestão de assinaturas.</li>
                      <li><strong className="text-cyan-950">Serviços de Comunicação Segura:</strong> Gateways de e-mail transacional e autenticação multifator.</li>
                    </ul>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">5.2. Médicos e Profissionais de Saúde</h3>
                    <p className="text-slate-700 leading-relaxed">
                      Seus dados médicos são disponibilizados exclusivamente para os médicos credenciados durante as consultas agendadas por você, resguardado o sigilo médico profissional.
                    </p>

                    <h3 className="text-xl font-bold text-cyan-900 mt-6">5.3. Autoridades Legais</h3>
                    <p className="text-slate-700 leading-relaxed">
                      Divulgaremos dados somente mediante ordem judicial fundamentada ou exigência legal explícita nos termos da legislação brasileira.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Direitos dos Titulares */}
              <section id="direitos-titulares">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">6. Direitos dos Titulares de Dados</h2>
                    <p className="text-slate-700 leading-relaxed">
                      Conforme os Artigos 17 a 22 da LGPD, você possui os seguintes direitos garantidos:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-2xl p-5 transition-colors">
                        <h3 className="font-bold text-cyan-950 mb-1">✓ Confirmação e Acesso</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Confirmar se tratamos seus dados e acessar uma cópia completa das suas informações.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-2xl p-5 transition-colors">
                        <h3 className="font-bold text-cyan-950 mb-1">✓ Correção de Dados</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Solicitar a retificação de dados incompletos, inexatos ou desatualizados.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-2xl p-5 transition-colors">
                        <h3 className="font-bold text-cyan-950 mb-1">✓ Anonimização ou Bloqueio</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Requerer a anonimização ou exclusão de dados tratados em desconformidade com a lei.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-2xl p-5 transition-colors">
                        <h3 className="font-bold text-cyan-950 mb-1">✓ Portabilidade</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Exportar seus dados e prontuário em formato estruturado e legível (JSON, PDF).
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-2xl p-5 transition-colors">
                        <h3 className="font-bold text-cyan-950 mb-1">✓ Eliminação dos Dados</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Solicitar a exclusão de dados tratados sob consentimento (ressalvada retenção legal).
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-2xl p-5 transition-colors">
                        <h3 className="font-bold text-cyan-950 mb-1">✓ Revogação do Consentimento</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Revogar sua autorização de tratamento a qualquer momento com facilidade.
                        </p>
                      </div>
                    </div>

                    <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6 mt-6">
                      <h3 className="font-bold text-cyan-950 mb-2">Como Exercer seus Direitos:</h3>
                      <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-3">
                        Você pode exercer seus direitos diretamente no painel da sua conta ou entrando em contato com nosso DPO:
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <a href="mailto:dpo@appmediai.com" className="inline-flex items-center gap-2 text-cyan-700 hover:text-cyan-800 font-bold underline">
                          <Mail className="h-4 w-4" /> dpo@appmediai.com
                        </a>
                        <span className="text-slate-500 text-xs sm:text-sm">• Resposta em até 15 dias úteis</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Retenção */}
              <section id="retencao">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">7. Retenção de Dados</h2>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h3 className="font-bold text-cyan-950 mb-2">Prontuários e Dados Clínicos</h3>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          Retidos por <strong>20 anos</strong> em cumprimento obrigatório à Resolução CFM nº 1.821/2007 e legislação médica brasileira.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h3 className="font-bold text-cyan-950 mb-2">Dados de Conta e Acesso</h3>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          Retidos enquanto a conta estiver ativa. Logs de conexão mantidos por <strong>6 meses</strong> conforme o Marco Civil da Internet.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Segurança */}
              <section id="seguranca">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4 flex items-center gap-3">
                      <Lock className="h-8 w-8 text-cyan-600" />
                      8. Segurança e Proteção
                    </h2>

                    <p className="text-slate-700 leading-relaxed">
                      Implementamos medidas técnicas e operacionais avançadas para proteger seus dados:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h3 className="font-bold text-cyan-950 mb-2">🔐 Criptografia Hospitalar</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          TLS 1.3 para dados em trânsito e criptografia AES-256 para dados em repouso no banco de dados.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h3 className="font-bold text-cyan-950 mb-2">🔑 Controle de Acesso Restrito</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Autenticação segura, princípio do menor privilégio e auditoria contínua de registros de acesso.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h3 className="font-bold text-cyan-950 mb-2">🛡️ Proteção de Infraestrutura</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Firewalls de aplicação web, proteção contra ataques DDoS e backups criptografados automáticos.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h3 className="font-bold text-cyan-950 mb-2">👥 Treinamento & Governança</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Equipe capacitada sob estritos acordos de sigilo profissional e compliance LGPD contínuo.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Cookies */}
              <section id="cookies">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">9. Cookies e Tecnologias de Rastreamento</h2>

                    <p className="text-slate-700 leading-relaxed">
                      Utilizamos cookies essenciais para manter sua sessão ativa, garantir a segurança do login e lembrar suas preferências de interface. Você pode configurar seu navegador para recusar cookies, ciente de que partes do sistema podem perder funcionalidade.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Menores */}
              <section id="menores">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">10. Dados de Menores</h2>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
                      <p className="text-amber-950 font-bold mb-2">⚠️ Proteção Especial e Consentimento Parental</p>
                      <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                        O cadastro e utilização da plataforma por menores de 18 anos exige obrigatoriamente a representação ou consentimento expresso de pelo menos um dos pais ou responsável legal, nos termos do Art. 14 da LGPD e do Estatuto da Criança e do Adolescente (ECA).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Transferência Internacional */}
              <section id="transferencia">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">11. Transferência Internacional de Dados</h2>

                    <p className="text-slate-700 leading-relaxed">
                      Eventuais servidores ou serviços de computação em nuvem operados no exterior obedecem estritamente às diretrizes da LGPD (Art. 33), mediante cláusulas contratuais padronizadas e certificados de segurança de nível internacional.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Alterações */}
              <section id="alteracoes">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-4">12. Alterações nesta Política</h2>

                    <p className="text-slate-700 leading-relaxed">
                      Podemos atualizar esta Política periodicamente. Qualquer alteração relevante será notificada através de aviso em destaque na plataforma ou via e-mail antes de entrar em vigor.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* DPO / Encarregado */}
              <section id="contato">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-8 space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mb-2 flex items-center gap-3">
                      <Mail className="h-8 w-8 text-cyan-600" />
                      13. Encarregado de Proteção de Dados (DPO) e Contato
                    </h2>

                    <p className="text-slate-700 leading-relaxed">
                      Em cumprimento ao Art. 41 da LGPD, disponibilizamos canal direto com nosso Encarregado de Proteção de Dados:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-6 space-y-3">
                        <h3 className="font-bold text-cyan-950 text-lg">Canal do Titular (DPO)</h3>
                        <div className="space-y-1.5 text-slate-700 text-sm">
                          <p><strong>Encarregado:</strong> DPO MediAI Saúde</p>
                          <p><strong>E-mail:</strong> <a href="mailto:dpo@appmediai.com" className="text-cyan-700 hover:text-cyan-800 font-bold underline">dpo@appmediai.com</a></p>
                          <p><strong>Prazo de Atendimento:</strong> Até 15 dias úteis</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
                        <h3 className="font-bold text-cyan-950 text-lg">Controlador dos Dados</h3>
                        <div className="space-y-1 text-slate-700 text-sm">
                          <p><strong>Razão Social:</strong> MediAI Tecnologia em Saúde Ltda.</p>
                          <p><strong>Endereço:</strong> Rd. Arthur Bernardes, Pss Novo Continente - nº 34A</p>
                          <p>Belém - PA, Brasil</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Action Footer */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-4">
                <p className="text-slate-700 leading-relaxed max-w-2xl mx-auto text-sm sm:text-base">
                  Esta Política de Privacidade foi elaborada sob os princípios da transparência e proteção integral dos dados de saúde do cidadão.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <Button asChild variant="outline" className="border-2 border-slate-300 text-slate-800 hover:bg-cyan-50 hover:text-cyan-950 hover:border-cyan-400 font-bold bg-white rounded-xl">
                    <Link href="/termos">Ver Termos de Uso</Link>
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
