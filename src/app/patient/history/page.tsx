import Header from "@/components/layout/header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ChevronRight, Droplets, Bone } from "lucide-react";
import Link from "next/link";
import { getExamsByPatientId } from "@/lib/firestore-adapter";
import type { Exam } from "@/types";

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

const iconMap: { [key: string]: React.ReactNode } = {
    'Droplets': <Droplets className="h-6 w-6 text-primary" />,
    'Bone': <Bone className="h-6 w-6 text-primary" />,
    'FileText': <FileText className="h-6 w-6 text-primary" />,
    'default': <FileText className="h-6 w-6 text-primary" />,
};

const getIconForExam = (exam: Exam) => {
    // A simple logic to determine icon based on exam type name
    if (exam.type.toLowerCase().includes('sangue')) return iconMap['Droplets'];
    if (exam.type.toLowerCase().includes('imagem')) return iconMap['Bone'];
    if (exam.type.toLowerCase().includes('raio-x')) return iconMap['Bone'];
    return iconMap[exam.icon] || iconMap['default'];
}

export default async function ExamHistoryPage() {
  const exams = await getExamsByPatientId(MOCK_PATIENT_ID);

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
          {exams.length > 0 ? (
            exams.map((exam) => (
              <Link href={`/patient/history/${exam.id}`} key={exam.id}>
                <Card className="transition-all hover:shadow-md hover:border-primary">
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                          {getIconForExam(exam)}
                          <div>
                              <CardTitle className="text-lg">{exam.type}</CardTitle>
                              <CardDescription>{new Date(exam.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</CardDescription>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-muted-foreground hidden md:block">{exam.result}</p>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                  </CardHeader>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nenhum exame encontrado</CardTitle>
                <CardDescription>
                  Você ainda não enviou nenhum exame para análise. Comece fazendo o upload na página principal.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
