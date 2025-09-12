
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Stethoscope, User } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(to right, #edb6d9, #f2f3ef)' }}>
      <div className="w-full max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-[#ea339e]">Cadastro</h1>
        <p className="text-lg text-center mb-8 text-black font-medium">
          Escolha o tipo de cadastro que deseja realizar
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-[#ea339e]/20" style={{ background: 'linear-gradient(to bottom right, #fff8fc, #f9e6f3)' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#ea339e]">Sou Paciente</CardTitle>
              <CardDescription className="text-black font-medium">
                Cadastre-se como paciente para agendar consultas e acompanhar seu histórico médico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-black mb-6">
                Como paciente, você poderá:
              </p>
              <ul className="space-y-2 mb-6 text-black">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#ea339e] mr-2 shrink-0" />
                  <span>Agendar consultas com médicos</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#ea339e] mr-2 shrink-0" />
                  <span>Acompanhar seu histórico médico</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#ea339e] mr-2 shrink-0" />
                  <span>Receber lembretes de consultas</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-[#ea339e] hover:bg-[#d12b8d]">
                <Link href="/register/patient">Cadastrar como Paciente</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-[#ea339e]/20" style={{ background: 'linear-gradient(to bottom right, #fff8fc, #f9e6f3)' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#ea339e]">Sou Médico</CardTitle>
              <CardDescription className="text-black font-medium">
                Cadastre-se como médico para gerenciar sua agenda e atender pacientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-black mb-6">
                Como médico, você poderá:
              </p>
              <ul className="space-y-2 mb-6 text-black">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#ea339e] mr-2 shrink-0" />
                  <span>Gerenciar sua agenda de consultas</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#ea339e] mr-2 shrink-0" />
                  <span>Acessar histórico de pacientes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#ea339e] mr-2 shrink-0" />
                  <span>Emitir receitas e atestados</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-[#ea339e] hover:bg-[#d12b8d]">
                <Link href="/register/doctor">Cadastrar como Médico</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-black">
            Já possui uma conta?{" "}
            <Link href="/login" className="text-[#ea339e] hover:text-[#d12b8d] font-medium underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
