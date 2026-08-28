
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Stethoscope, User, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import MediAILogo from "@/components/layout/mediai-logo";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-[#070e24] to-slate-950 text-white relative overflow-hidden px-4 py-12">
      {/* Background Ambient Lights */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700 pointer-events-none"></div>
      
      <div className="w-full max-w-5xl px-4 py-8 relative z-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="hover:opacity-95 transition-opacity">
            <MediAILogo size="lg" />
          </Link>
        </div>

        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs sm:text-sm text-cyan-300 font-semibold tracking-wide uppercase">O futuro da saúde digital</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
            Crie sua Conta MediAI
          </h1>
          
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Selecione seu perfil para iniciar uma experiência personalizada e inteligente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Patient Card */}
          <Card className="group relative bg-slate-900/70 backdrop-blur-2xl border border-cyan-500/20 hover:border-cyan-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
            
            <div>
              <CardHeader className="relative pb-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="h-7 w-7 text-cyan-400" />
                </div>
                
                <CardTitle className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">Sou Paciente</CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Acesse diagnósticos com IA, podcasts de saúde, consultas online e acompanhe seu histórico
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm font-medium text-cyan-300">
                  Benefícios inclusos:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-cyan-400 mr-2.5 shrink-0 mt-0.5" />
                    <span>Análise inteligente de exames com 25+ especialistas IA</span>
                  </li>
                  <li className="flex items-start text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-cyan-400 mr-2.5 shrink-0 mt-0.5" />
                    <span>Podcasts diários personalizados sobre seus laudos</span>
                  </li>
                  <li className="flex items-start text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-cyan-400 mr-2.5 shrink-0 mt-0.5" />
                    <span>Consultas e triagens em tempo real 24/7</span>
                  </li>
                </ul>
              </CardContent>
            </div>
            
            <div className="p-6 pt-0">
              <Button asChild className="w-full py-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-600 hover:from-cyan-400 hover:via-blue-500 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-0 flex items-center justify-center gap-2">
                <Link href="/register/patient">
                  <span>Cadastrar como Paciente</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Doctor Card */}
          <Card className="group relative bg-slate-900/70 backdrop-blur-2xl border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
            
            <div>
              <CardHeader className="relative pb-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Stethoscope className="h-7 w-7 text-purple-400" />
                </div>
                
                <CardTitle className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">Sou Médico</CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Potencialize seu consultório com telemedicina, copiloto de diagnóstico e prontuário digital
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm font-medium text-purple-300">
                  Recursos profissionais:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-purple-400 mr-2.5 shrink-0 mt-0.5" />
                    <span>Copiloto de IA para validação rápida de exames e laudos</span>
                  </li>
                  <li className="flex items-start text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-purple-400 mr-2.5 shrink-0 mt-0.5" />
                    <span>Gestão completa de agenda e teleconsultas em HD</span>
                  </li>
                  <li className="flex items-start text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-purple-400 mr-2.5 shrink-0 mt-0.5" />
                    <span>Acesso a histórico longitudinal seguro com LGPD</span>
                  </li>
                </ul>
              </CardContent>
            </div>
            
            <div className="p-6 pt-0">
              <Button asChild className="w-full py-6 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-0 flex items-center justify-center gap-2">
                <Link href="/register/doctor">
                  <span>Cadastrar como Médico</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm">
            Já possui uma conta ativa?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold underline transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
