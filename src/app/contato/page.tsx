"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/header";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
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
          description: "Entraremos em contato em breve.",
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
                Entre em Contato
              </h1>
              <p className="text-xl md:text-2xl text-blue-200/80 leading-relaxed">
                Estamos aqui para ajudar. Entre em contato conosco.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="relative w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-cyan-300 flex items-center gap-3">
                      <MessageSquare className="h-6 w-6" />
                      Envie uma Mensagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="nome" className="text-blue-100">Nome Completo</Label>
                        <Input
                          id="nome"
                          name="nome"
                          type="text"
                          placeholder="Seu nome"
                          value={formData.nome}
                          onChange={handleChange}
                          required
                          className="bg-slate-900/50 border-cyan-500/30 text-white placeholder:text-blue-300/50 focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-blue-100">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="bg-slate-900/50 border-cyan-500/30 text-white placeholder:text-blue-300/50 focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="assunto" className="text-blue-100">Assunto</Label>
                        <Input
                          id="assunto"
                          name="assunto"
                          type="text"
                          placeholder="Qual é o assunto?"
                          value={formData.assunto}
                          onChange={handleChange}
                          required
                          className="bg-slate-900/50 border-cyan-500/30 text-white placeholder:text-blue-300/50 focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mensagem" className="text-blue-100">Mensagem</Label>
                        <Textarea
                          id="mensagem"
                          name="mensagem"
                          placeholder="Escreva sua mensagem aqui..."
                          value={formData.mensagem}
                          onChange={handleChange}
                          required
                          rows={6}
                          className="bg-slate-900/50 border-cyan-500/30 text-white placeholder:text-blue-300/50 focus:border-cyan-500 resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300"
                      >
                        {loading ? (
                          "Enviando..."
                        ) : (
                          <>
                            <Send className="h-5 w-5 mr-2" />
                            Enviar Mensagem
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-300 mb-2">Email</h3>
                        <p className="text-blue-100/70 mb-2">
                          Para dúvidas gerais e suporte:
                        </p>
                        <a href="mailto:contato@appmediai.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                          contato@appmediai.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-emerald-300 mb-2">Telefone</h3>
                        <p className="text-blue-100/70 mb-2">
                          Atendimento de segunda a sexta:
                        </p>
                        <a href="tel:+5591993905869" className="text-cyan-400 hover:text-cyan-300 transition-colors text-lg">
                          (91) 99390-5869
                        </a>
                        <p className="text-sm text-blue-200/50 mt-2">
                          Das 8h às 18h (horário de Brasília)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-orange-300 mb-2">Endereço</h3>
                        <p className="text-blue-100/70 leading-relaxed">
                          MediAI Tecnologia em Saúde Ltda.<br />
                          Rd. Arthur Bernardes, Pss Novo Continente - nº 34A<br />
                          Belém - PA
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-cyan-300 mb-2">Horário de Atendimento</h3>
                        <div className="space-y-1 text-blue-100/70">
                          <p>Segunda a Sexta: 8h - 18h</p>
                          <p>Sábado: 9h - 14h</p>
                          <p>Domingo: Fechado</p>
                          <p className="text-cyan-400 mt-3 font-semibold">
                            Plataforma IA disponível 24/7
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* DPO Contact */}
        <section className="relative w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-cyan-500/20 shadow-2xl">
                <CardContent className="p-8 md:p-12">
                  <h2 className="text-3xl font-bold text-cyan-300 mb-6">Encarregado de Proteção de Dados (DPO)</h2>
                  <p className="text-lg text-blue-100/80 mb-6 leading-relaxed">
                    Para questões relacionadas à privacidade, proteção de dados pessoais (LGPD), 
                    exercício de direitos do titular ou reclamações sobre tratamento de dados:
                  </p>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                    <p className="text-blue-100 mb-2">
                      <strong className="text-cyan-300">Email do DPO:</strong>{" "}
                      <a href="mailto:dpo@appmediai.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                        dpo@appmediai.com
                      </a>
                    </p>
                    <p className="text-sm text-blue-200/60 mt-4">
                      Responderemos solicitações relacionadas à LGPD em até 15 dias úteis.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-6">
                Perguntas Frequentes?
              </h2>
              <p className="text-lg text-blue-200/70 mb-8">
                Antes de entrar em contato, confira nossa central de ajuda
              </p>
              <Button asChild variant="outline" size="lg" className="h-12 border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 font-semibold px-8 rounded-xl">
                <Link href="/sobre">
                  Saiba Mais Sobre Nós
                </Link>
              </Button>
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
