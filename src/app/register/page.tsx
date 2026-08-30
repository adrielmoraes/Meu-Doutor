import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Stethoscope, User, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import MediAILogo from "@/components/layout/mediai-logo";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden px-4 py-12 selection:bg-cyan-500 selection:text-white">
      {/* Background Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-5xl px-4 py-8 relative z-10 mx-auto">
        <div className="flex justify-center mb-8">
          <Link href="/" className="hover:opacity-95 transition-opacity">
            <MediAILogo size="lg" />
          </Link>
        </div>

        <div className="text-center mb-12 space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 shadow-sm">
            <Sparkles className="h-4 w-4 text-cyan-600" />
            <span className="text-xs sm:text-sm text-cyan-900 font-semibold uppercase tracking-wider">O futuro da saúde digital</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-900 tracking-tight">
            Crie sua Conta MediAI
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Selecione seu perfil para iniciar uma experiência personalizada, ágil e inteligente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Patient Card */}
          <Card className="group bg-white border border-slate-200 hover:border-cyan-400 transition-all duration-300 shadow-xl shadow-slate-900/5 hover:shadow-2xl rounded-3xl overflow-hidden flex flex-col justify-between p-2">
            <div>
              <CardHeader className="relative pb-4 pt-6 px-6">
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-4 text-cyan-600 group-hover:scale-105 transition-transform">
                  <User className="h-7 w-7" />
                </div>
                
                <CardTitle className="text-2xl font-bold text-cyan-950">Sou Paciente</CardTitle>
                <CardDescription className="text-slate-600 text-sm">
                  Acesse análises por IA de exames, podcasts de saúde, telemedicina e acompanhamento contínuo.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 px-6">
                <p className="text-xs font-bold text-cyan-800 uppercase tracking-wider">
                  Benefícios inclusos:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-cyan-600 mr-2.5 shrink-0 mt-0.5" />
                    <span>Análise inteligente de exames com 25+ especialistas IA</span>
                  </li>
                  <li className="flex items-start text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-cyan-600 mr-2.5 shrink-0 mt-0.5" />
                    <span>Podcasts personalizados e fáceis sobre seus laudos</span>
                  </li>
                  <li className="flex items-start text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-cyan-600 mr-2.5 shrink-0 mt-0.5" />
                    <span>Consultas ao vivo e triagens por voz 24/7</span>
                  </li>
                </ul>
              </CardContent>
            </div>
            
            <div className="p-6 pt-2">
              <Button asChild className="w-full py-6 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-base shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] border-0 flex items-center justify-center gap-2">
                <Link href="/register/patient">
                  <span>Cadastrar como Paciente</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Doctor Card */}
          <Card className="group bg-white border border-slate-200 hover:border-cyan-400 transition-all duration-300 shadow-xl shadow-slate-900/5 hover:shadow-2xl rounded-3xl overflow-hidden flex flex-col justify-between p-2">
            <div>
              <CardHeader className="relative pb-4 pt-6 px-6">
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-4 text-cyan-600 group-hover:scale-105 transition-transform">
                  <Stethoscope className="h-7 w-7" />
                </div>
                
                <CardTitle className="text-2xl font-bold text-cyan-950">Sou Médico (CRM)</CardTitle>
                <CardDescription className="text-slate-600 text-sm">
                  Potencialize seu consultório com telemedicina HD, copiloto de diagnóstico e prontuário digital.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 px-6">
                <p className="text-xs font-bold text-cyan-800 uppercase tracking-wider">
                  Recursos para profissionais:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-cyan-600 mr-2.5 shrink-0 mt-0.5" />
                    <span>Copiloto de IA para diagnósticos diferenciais e laudos</span>
                  </li>
                  <li className="flex items-start text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-cyan-600 mr-2.5 shrink-0 mt-0.5" />
                    <span>Ambiente de telemedicina seguro e certificado CFM</span>
                  </li>
                  <li className="flex items-start text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-cyan-600 mr-2.5 shrink-0 mt-0.5" />
                    <span>Prontuário unificado e gestão inteligente de pacientes</span>
                  </li>
                </ul>
              </CardContent>
            </div>
            
            <div className="p-6 pt-2">
              <Button asChild className="w-full py-6 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-base shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] border-0 flex items-center justify-center gap-2">
                <Link href="/register/doctor">
                  <span>Cadastrar como Médico</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-slate-600">
            Já possui uma conta?{" "}
            <Link href="/login" className="text-cyan-700 hover:text-cyan-800 font-bold transition-colors">
              Faça login aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
