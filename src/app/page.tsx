
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, User } from "lucide-react";
import Link from "next/link";
import Header from "@/components/layout/header";

export default function PortalSelectionPage() {
  const portals = [
    {
      title: "Portal do Paciente",
      icon: <User className="h-12 w-12 text-primary" />,
      href: "/patient/dashboard",
      description: "Acesse seu painel, consulte a IA e veja seus exames e metas de saúde.",
      id: "patient-portal"
    },
    {
      title: "Portal do Médico",
      icon: <Stethoscope className="h-12 w-12 text-primary" />,
      href: "/doctor",
      description: "Gerencie seus pacientes, valide diagnósticos e acesse o histórico de atendimentos.",
      id: "doctor-portal"
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
       <Header />
       <main className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="container mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Bem-vindo ao MediAI</h1>
            <p className="text-xl text-muted-foreground mb-12">Seu assistente de saúde inteligente. Selecione seu portal para começar.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {portals.map((portal) => (
                     <Link href={portal.href} key={portal.id}>
                        <Card className="text-left transform transition-transform duration-300 hover:scale-105 hover:shadow-xl h-full">
                            <CardHeader className="flex flex-row items-start gap-4">
                                {portal.icon}
                                <div>
                                    <CardTitle className="text-2xl font-bold">
                                        {portal.title}
                                    </CardTitle>
                                    <CardDescription>{portal.description}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
       </main>
    </div>
  );
}
