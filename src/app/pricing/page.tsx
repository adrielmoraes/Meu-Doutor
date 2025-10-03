
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Link from "next/link";
import { Check, Zap, Crown, Sparkles } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <Header />
      <main className="flex-1 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        
        {/* Hero */}
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center space-y-6 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-cyan-300">Planos Simples e Transparentes</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                Escolha Seu Plano
              </h1>
              
              <p className="text-xl text-blue-200/70 max-w-3xl mx-auto">
                Comece grátis por 5 dias. Sem cartão de crédito. Cancele quando quiser.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600/50">
                        <Zap className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm text-cyan-300 font-medium">Teste Grátis</span>
                      </div>
                      
                      <h2 className="text-3xl font-bold text-white">Free</h2>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold text-white">R$0</span>
                        <span className="text-blue-200/60">/ 5 dias</span>
                      </div>
                      
                      <p className="text-blue-200/70">
                        Experimente todos os recursos premium gratuitamente por 5 dias
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 py-6 border-y border-slate-700/50">
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Acesso total por 5 dias</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">15 especialistas IA</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Análise ilimitada de exames</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Consultas ao vivo com IA</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Monitoramento de saúde</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Sem cartão de crédito</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button asChild size="lg" variant="outline" className="w-full h-14 border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 font-semibold text-lg rounded-xl backdrop-blur-sm transition-all">
                      <Link href="/register/patient">
                        Começar Teste Grátis
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Pro Plan - Popular */}
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-all animate-pulse"></div>
                
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 md:p-10 border-2 border-cyan-500/50">
                  {/* Popular Badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/50">
                      MAIS POPULAR
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-4 pt-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50">
                        <Crown className="h-4 w-4 text-cyan-300" />
                        <span className="text-sm text-cyan-200 font-medium">Plano Completo</span>
                      </div>
                      
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                        Pro
                      </h2>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                          R$97,99
                        </span>
                        <span className="text-blue-200/60">/ mês</span>
                      </div>
                      
                      <p className="text-blue-200/70">
                        Acesso ilimitado a todos os recursos premium da plataforma
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 py-6 border-y border-cyan-500/20">
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100 font-medium">Tudo do plano Free</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Análises ilimitadas de exames</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Consultas ao vivo 24/7</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Conexão com médicos reais</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Histórico completo de saúde</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Recomendações personalizadas</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Suporte prioritário</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-100">Cancele quando quiser</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button asChild size="lg" className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg rounded-xl shadow-2xl shadow-cyan-500/30 transition-all transform hover:scale-105">
                      <Link href="/register/patient">
                        Assinar Agora
                      </Link>
                    </Button>
                    
                    <p className="text-center text-sm text-blue-200/50">
                      Inicia após o período de teste grátis
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ / Info */}
            <div className="mt-20 max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Perguntas Frequentes</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/10">
                  <h3 className="font-bold text-lg text-cyan-300 mb-2">Como funciona o teste grátis?</h3>
                  <p className="text-blue-200/70">
                    Acesse todos os recursos premium por 5 dias sem custo. Não é necessário cartão de crédito.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/10">
                  <h3 className="font-bold text-lg text-cyan-300 mb-2">Posso cancelar a qualquer momento?</h3>
                  <p className="text-blue-200/70">
                    Sim! Cancele sua assinatura quando quiser, sem taxas ou penalidades.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/10">
                  <h3 className="font-bold text-lg text-cyan-300 mb-2">Os dados são seguros?</h3>
                  <p className="text-blue-200/70">
                    100% seguro com criptografia end-to-end e conformidade total com LGPD.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/10">
                  <h3 className="font-bold text-lg text-cyan-300 mb-2">Médicos reais validam?</h3>
                  <p className="text-blue-200/70">
                    Sim! No plano Pro você pode conectar com médicos reais para validar diagnósticos da IA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="relative w-full border-t border-cyan-500/20 bg-gradient-to-b from-slate-950 to-black">
        <div className="container px-4 md:px-6 py-12">
          <div className="text-center text-sm text-blue-200/50">
            <p>&copy; {new Date().getFullYear()} MediAI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
