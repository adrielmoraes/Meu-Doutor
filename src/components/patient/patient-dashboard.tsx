
import { FileClock, UserPlus, HeartPulse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import AIConsultationCard from "./ai-consultation-card";
import ExamUploadCard from "./exam-upload-card";
import HealthGoalsPanel from "./health-goals-panel";
import type { Patient } from "@/types";
import type { GenerateHealthInsightsOutput } from "@/ai/flows/generate-health-insights";

interface PatientDashboardProps {
    patient: Patient;
    healthInsights: GenerateHealthInsightsOutput | null;
}

const PatientDashboard = ({ patient, healthInsights }: PatientDashboardProps) => {
  const cards = [
    {
      title: "Histórico e Análise de Exames",
      icon: <FileClock className="h-8 w-8 text-primary" />,
      href: "/patient/history",
      description: "Veja seus exames e análises da IA.",
    },
    {
      title: "Meu Plano de Bem-Estar",
      icon: <HeartPulse className="h-8 w-8 text-primary" />,
      href: "/patient/wellness",
      description: "Receba um plano de vida saudável da IA.",
    },
    {
      title: "Conexão com o Médico Humano",
      icon: <UserPlus className="h-8 w-8 text-primary" />,
      href: "/patient/doctors",
      description: "Consulte um médico da nossa rede.",
    },
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Bem-vindo, {patient.name}!
        </h1>
        <p className="text-muted-foreground">
          Sua saúde, simplificada. Acesse suas informações e interaja com nossa IA.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main interactive cards */}
        <AIConsultationCard />
        <ExamUploadCard />

        {/* Health Goals Panel takes up more space if available */}
        {healthInsights && <HealthGoalsPanel insights={healthInsights} />}

        {/* Other navigation cards */}
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
