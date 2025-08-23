import { Video, FileClock, Upload, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import AIConsultationCard from "./ai-consultation-card";
import ExamUploadCard from "./exam-upload-card";

const PatientDashboard = () => {
  const cards = [
    {
      title: "Histórico e Análise de Exames",
      icon: <FileClock className="h-8 w-8 text-primary" />,
      href: "/patient/history",
      description: "Veja seus exames e análises da IA.",
    },
    {
      title: "Conexão com o Médico Humano",
      icon: <UserPlus className="h-8 w-8 text-primary" />,
      href: "/patient/doctors",
      description: "Consulte um médico da nossa rede.",
    },
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Bem-vindo ao seu Oásis de Saúde Digital
        </h1>
        <p className="text-muted-foreground">
          Sua saúde, simplificada. Acesse suas informações e interaja com nossa IA.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        <AIConsultationCard />
        <ExamUploadCard />

        {cards.map((card) => (
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
  );
};

export default PatientDashboard;
