"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/header";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Sparkles, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContatoPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    assunto: "",
    mensagem: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.nome,
          email: formData.email,
          subject: formData.assunto,
          message: formData.mensagem,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Mensagem enviada com sucesso!",
          description: "Nossa equipe entrará em contato em breve.",
        });

        setFormData({
          nome: "",
          email: "",
          assunto: "",
          mensagem: ""
        });
      } else {
        toast({
          title: "Erro ao enviar mensagem",
          description: data.message || "Por favor, tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Por favor, verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
                <span className="text-xs sm:text-sm font-semibold text-cyan-900">Atendimento & Suporte • Estamos Aqui por Você</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-cyan-900 tracking-tight">
                Fale Conosco
              </h1>
              
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Tire dúvidas, envie sugestões ou solicite suporte. Nossa equipe médica e de tecnologia responderá prontamente.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="relative w-full py-10 pb-20">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              
              {/* Contact Form */}
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl shadow-slate-900/5 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-cyan-950">Envie uma Mensagem</h2>
                    <p className="text-xs text-slate-500">Respondemos em até 2 horas úteis</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome" className="text-sm font-medium text-slate-700">Nome Completo</Label>
                    <Input
                      id="nome"
                      name="nome"
                      type="text"
                      placeholder="Seu nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                      className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="assunto" className="text-sm font-medium text-slate-700">Assunto</Label>
                    <Input
                      id="assunto"
                      name="assunto"
                      type="text"
                      placeholder="Sobre o que deseja falar?"
                      value={formData.assunto}
                      onChange={handleChange}
                      required
                      className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mensagem" className="text-sm font-medium text-slate-700">Mensagem</Label>
                    <Textarea
                      id="mensagem"
                      name="mensagem"
                      placeholder="Escreva sua dúvida ou mensagem detalhada..."
                      value={formData.mensagem}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 resize-none rounded-xl"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-base rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300 border-0"
                  >
                    {loading ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Contact Information Cards */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-cyan-950 mb-1">E-mail Oficial</h3>
                    <p className="text-slate-600 text-sm mb-1">Para dúvidas gerais, sugestões e parcerias:</p>
                    <a href="mailto:contato@appmediai.com" className="text-cyan-600 hover:text-cyan-700 font-semibold text-base transition-colors">
                      contato@appmediai.com
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-cyan-950 mb-1">Telefone & WhatsApp</h3>
                    <p className="text-slate-600 text-sm mb-1">Atendimento humanizado de seg. a sex.:</p>
                    <a href="tel:+5591993905869" className="text-cyan-600 hover:text-cyan-700 font-semibold text-base transition-colors">
                      (91) 99390-5869
                    </a>
                    <p className="text-xs text-slate-400 mt-1">Das 8h às 18h (Horário de Brasília)</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-cyan-950 mb-1">Disponibilidade da IA</h3>
                    <p className="text-slate-600 text-sm">
                      A plataforma inteligente e a assistente virtual Dra. Sofia estão operacionais <strong>24 horas por dia, 7 dias por semana</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-cyan-950 mb-1">Sede Institucional</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      MediAI Tecnologia em Saúde Ltda.<br />
                      Rd. Arthur Bernardes, Pss Novo Continente - nº 34A<br />
                      Belém - PA, Brasil
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* DPO Section */}
        <section className="relative w-full py-12 bg-slate-50 border-t border-slate-200">
          <div className="container px-4 md:px-6 mx-auto max-w-4xl">
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-cyan-600" />
                <h2 className="text-2xl font-bold text-cyan-950">
                  Encarregado de Proteção de Dados (DPO)
                </h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Para assuntos relacionados à privacidade, tratamento de dados de saúde, exercício de direitos do titular previstos na Lei Geral de Proteção de Dados (LGPD):
              </p>
              <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-sm font-semibold text-cyan-950">Canal Direto do DPO:</span>
                <a href="mailto:dpo@appmediai.com" className="text-sm font-bold text-cyan-700 hover:text-cyan-800">
                  dpo@appmediai.com
                </a>
              </div>
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
          </p>
        </div>
      </footer>
    </div>
  );
}
