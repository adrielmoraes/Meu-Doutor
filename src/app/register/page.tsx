
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, User } from "lucide-react";
import Link from "next/link";

export default function RegistrationTypeSelectionPage() {
  const options = [
    {
      title: "Sou um Paciente",
      icon: <User className="h-12 w-12 text-primary" />,
      href: "/register/patient",
      description: "Quero usar a IA, agendar consultas e gerenciar minha saúde.",
      id: "patient-register"
    },
    {
      title: "Sou um Médico",
      icon: <Stethoscope className="h-12 w-12 text-primary" />,
      href: "/register/doctor",
      description: "Quero me juntar à rede para atender pacientes e validar diagnósticos.",
      id: "doctor-register"
    },
  ];

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-muted/20 p-4">
       <div className="mx-auto text-center max-w-2xl mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Seja bem-vindo(a) ao MediAI</h1>
          <p className="text-lg text-muted-foreground">Para começar, escolha o tipo de conta que você deseja criar.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {options.map((portal) => (
               <Link href={portal.href} key={portal.id} className="group">
                  <Card className="text-left transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl h-full">
                      <CardHeader className="flex flex-row items-start gap-4">
                          {portal.icon}
                          <div>
                              <CardTitle className="text-xl font-bold">
                                  {portal.title}
                              </CardTitle>
                              <CardDescription>{portal.description}</CardDescription>
                          </div>
                      </CardHeader>
                  </Card>
              </Link>
          ))}
      </div>
       <div className="mt-8 text-center text-sm">
        Já tem uma conta?{" "}
        <Link href="/login" className="underline">
          Faça o login
        </Link>
      </div>
    </div>
  );
}
