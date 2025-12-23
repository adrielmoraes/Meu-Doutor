
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Stethoscope, User, Sparkles } from "lucide-react";
import Link from "next/link";
import MediAILogo from "@/components/layout/mediai-logo";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      
      <div className="w-full max-w-5xl px-4 py-8 relative z-10">
        <div className="flex justify-center mb-8">
          <MediAILogo size="lg" />
        </div>

        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Junte-se ao futuro da saúde</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Criar Conta
          </h1>
          
          <p className="text-lg text-blue-200/70 max-w-2xl mx-auto">
            Escolha o tipo de cadastro que deseja realizar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Patient Card */}
          <Card className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <CardHeader className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                <User className="h-7 w-7 text-cyan-400" />
              </div>
              
              <CardTitle className="text-2xl font-bold text-cyan-300">Sou Paciente</CardTitle>
              <CardDescription className="text-blue-200/70">
                Cadastre-se como paciente para agendar consultas e acompanhar seu histórico médico
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative">
              <p className="text-blue-100 mb-6">
                Como paciente, você poderá:
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mr-3 shrink-0 mt-0.5" />
                  <span className="text-blue-200">Diagnósticos instantâneos com IA</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mr-3 shrink-0 mt-0.5" />
                  <span className="text-blue-200">Consultas ao vivo 24/7</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-cyan-400 mr-3 shrink-0 mt-0.5" />
                  <span className="text-blue-200">Monitoramento personalizado</span>
                </li>
              </ul>
              
              <Button asChild className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all">
                <Link href="/register/patient">Cadastrar como Paciente</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Card */}
          <Card className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <CardHeader className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                <Stethoscope className="h-7 w-7 text-purple-400" />
              </div>
              
              <CardTitle className="text-2xl font-bold text-purple-300">Sou Médico</CardTitle>
              <CardDescription className="text-blue-200/70">
                Cadastre-se como médico para gerenciar sua agenda e atender pacientes
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative">
              <p className="text-blue-100 mb-6">
                Como médico, você poderá:
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-purple-400 mr-3 shrink-0 mt-0.5" />
                  <span className="text-blue-200">Validar diagnósticos de IA</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-purple-400 mr-3 shrink-0 mt-0.5" />
                  <span className="text-blue-200">Gerenciar consultas remotas</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-purple-400 mr-3 shrink-0 mt-0.5" />
                  <span className="text-blue-200">Acessar histórico completo</span>
                </li>
              </ul>
              
              <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all">
                <Link href="/register/doctor">Cadastrar como Médico</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-center">
          <p className="text-blue-200/70">
            Já possui uma conta?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
