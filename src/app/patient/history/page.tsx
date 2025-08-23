import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ChevronRight, Droplets, Bone } from "lucide-react";
import Link from "next/link";

const exams = [
  { id: '1', type: 'Exame de Sangue', date: '15 de Ago, 2025', result: 'Níveis de colesterol levemente elevados.', icon: <Droplets className="h-6 w-6 text-primary" /> },
  { id: '2', type: 'Exame de Imagem', date: '02 de Jul, 2025', result: 'Raio-X do tórax sem anormalidades.', icon: <Bone className="h-6 w-6 text-primary" /> },
  { id: '3', type: 'Exame de Sangue', date: '10 de Jan, 2025', result: 'Hemograma completo dentro dos padrões.', icon: <Droplets className="h-6 w-6 text-primary" /> },
];

export default function ExamHistoryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Exames</h1>
          <p className="text-muted-foreground">
            Acesse todos os seus exames e as análises geradas pela IA.
          </p>
        </div>

        <div className="space-y-4">
          {exams.map((exam) => (
            <Link href={`/patient/history/${exam.id}`} key={exam.id}>
              <Card className="transition-all hover:shadow-md hover:border-primary">
                <CardHeader className="flex flex-row items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        {exam.icon}
                        <div>
                            <CardTitle className="text-lg">{exam.type}</CardTitle>
                            <CardDescription>{exam.date}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground hidden md:block">{exam.result}</p>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
