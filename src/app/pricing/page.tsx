import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import { Check, Zap, Crown, Sparkles, Shield, Clock, HeartPulse } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      <Header />
      <main className="flex-1 relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/40 to-slate-50">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
        
        {/* Hero */}
        <section className="relative py-16 md:py-24">
          <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 shadow-sm">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                <span className="text-xs sm:text-sm font-semibold text-cyan-900">Planos Simples, Transparentes e Sem Surpresas</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-cyan-900 tracking-tight">
                Invista na Sua Saúde & da Sua Família
              </h1>
              
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Comece gratuitamente por 5 dias. Sem necessidade de cartão de crédito. Cancele quando quiser com 1 clique.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
              
              {/* Free Plan */}
              <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-lg shadow-slate-900/5 hover:border-cyan-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 w-fit text-xs font-semibold">
                      <Zap className="h-3.5 w-3.5 text-cyan-600" />
                      <span>Degustação Completa</span>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-cyan-950">Free</h2>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold text-cyan-950">R$0</span>
                      <span className="text-slate-500 font-medium">/ 5 dias</span>
                    </div>
                    
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Experimente todos os recursos de inteligência artificial médica sem qualquer compromisso.
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3.5 py-6 border-y border-slate-100 text-sm text-slate-700">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Acesso total liberado por 5 dias</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>25+ IAs especialistas em medicina</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Análise de exames (PDF, JPG, PNG)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Conversas por voz com a Dra. Sofia</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Podcast exclusivo da sua saúde</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Sem necessidade de cartão de crédito</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-6">
                  <Button asChild size="lg" className="w-full h-14 bg-white border-2 border-slate-300 hover:bg-cyan-50 hover:text-cyan-950 hover:border-cyan-500 text-slate-800 font-bold text-base rounded-2xl transition-all shadow-sm">
                    <Link href="/register/patient">
                      Começar Teste Grátis
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Pro Plan - Popular */}
              <div className="bg-white rounded-3xl p-8 md:p-10 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/10 flex flex-col justify-between relative overflow-hidden">
                {/* Popular Badge */}
                <div className="absolute top-0 right-0 bg-cyan-500 text-white font-bold text-xs px-5 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-md">
                  MAIS ESCOLHIDO
                </div>

                <div className="space-y-6">
                  {/* Header */}
                  <div className="space-y-3 pt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 w-fit text-xs font-semibold">
                      <Crown className="h-3.5 w-3.5 text-cyan-600" />
                      <span>Cuidado Contínuo & Ilimitado</span>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-cyan-950">Plano Pro</h2>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold text-cyan-950">R$97,99</span>
                      <span className="text-slate-500 font-medium">/ mês</span>
                    </div>
                    
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Proteção e tranquilidade médica contínua para você e toda a sua família o ano inteiro.
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3.5 py-6 border-y border-slate-100 text-sm text-slate-700">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span className="font-bold text-cyan-950">Tudo incluso do plano Free</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Análises ilimitadas de laudos e exames</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Atendimento 24/7 por vídeo e voz</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Conexão direta com médicos especialistas com CRM</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Prontuário inteligente vitalício</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Podcasts de evolução de exames ilimitados</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>Cancele quando quiser sem multas</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-6 space-y-2">
                  <Button asChild size="lg" className="w-full h-14 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.02] border-0">
                    <Link href="/register/patient">
                      Assinar Agora com 5 Dias Grátis
                    </Link>
                  </Button>
                  <p className="text-center text-xs text-slate-400">
                    Cobrança só é iniciada após o período de teste grátis
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ / Info */}
            <div className="mt-20 max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-cyan-900">Perguntas Frequentes sobre Planos</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-base text-cyan-950 mb-2">Como funciona o teste grátis?</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Você cria sua conta em segundos e tem acesso a todos os recursos premium por 5 dias sem precisar cadastrar cartão de crédito.
                  </p>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-base text-cyan-950 mb-2">Posso cancelar a qualquer momento?</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Sim! O cancelamento é 100% digital, transparente e pode ser feito a qualquer momento no seu painel sem taxas ou burocracia.
                  </p>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-base text-cyan-950 mb-2">Meus dados estão protegidos?</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Totalmente protegidos com criptografia hospitalar AES-256 e conformidade com a LGPD e regulamentações do CFM.
                  </p>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-base text-cyan-950 mb-2">Posso conectar com médicos reais?</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Sim! O plano Pro inclui a possibilidade de agendar teleconsultas em alta definição com médicos credenciados com CRM ativo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="w-full border-t border-slate-200 bg-white py-8">
        <div className="container px-4 md:px-6 mx-auto text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} MediAI Saúde Inteligente. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
