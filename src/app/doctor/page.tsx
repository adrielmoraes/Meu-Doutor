
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, History } from "lucide-react";
import Link from "next/link";

const DoctorDashboard = () => {
    const cards = [
    {
      title: "Meus Pacientes",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/doctor/patients",
      description: "Veja e gerencie a lista de seus pacientes.",
    },
    {
      title: "Consultas e Agendamentos",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      href: "/doctor/schedule",
      description: "Acesse sua agenda e consultas virtuais.",
    },
    {
      title: "Histórico de Atendimentos",
      icon: <History className="h-8 w-8 text-primary" />,
      href: "/doctor/history",
      description: "Revise seus atendimentos e diagnósticos passados.",
    },
  ];

  return (
    <div>
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
            <p className="text-muted-foreground">
            Gerencie seus pacientes, agenda e histórico de forma eficiente.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(card => (
                 <Card
                    key={card.title}
                    className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                >
                    <Link href={card.href} className="block h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold">
                        {card.title}
                        </CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                        {card.description}
                        </p>
                    </CardContent>
                    </Link>
                </Card>
            ))}
        </div>
    </div>
  )
}

export default DoctorDashboard;
