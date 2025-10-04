

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ChevronRight, Droplets, Bone, Trash2, AlertTriangle, Activity, Microscope, ScanLine } from "lucide-react";
import Link from "next/link";
import { getExamsByPatientId } from "@/lib/db-adapter";
import type { Exam } from "@/types";
import DeleteExamButton from "@/components/patient/delete-exam-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ExamTimelineChart } from "@/components/patient/exam-timeline-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const iconMap: { [key: string]: React.ReactNode } = {
    'Droplets': <Droplets className="h-6 w-6 text-primary" />,
    'Bone': <Bone className="h-6 w-6 text-primary" />,
    'FileText': <FileText className="h-6 w-6 text-primary" />,
    'default': <FileText className="h-6 w-6 text-primary" />,
};

const getIconForExam = (exam: Exam) => {
    if (exam.type.toLowerCase().includes('sangue')) return iconMap['Droplets'];
    if (exam.type.toLowerCase().includes('imagem')) return iconMap['Bone'];
    if (exam.type.toLowerCase().includes('raio-x')) return iconMap['Bone'];
    return iconMap[exam.icon] || iconMap['default'];
}

function groupExamsByType(exams: Exam[]): Record<string, Exam[]> {
  const grouped: Record<string, Exam[]> = {};
  
  exams.forEach((exam) => {
    const type = exam.type.toLowerCase();
    
    let category = 'Outros';
    if (type.includes('sangue')) category = 'Exames de Sangue';
    else if (type.includes('fezes') || type.includes('fecal')) category = 'Exames de Fezes';
    else if (type.includes('urina')) category = 'Exames de Urina';
    else if (type.includes('raio-x') || type.includes('raio x')) category = 'Raio-X';
    else if (type.includes('tomografia') || type.includes('ct') || type.includes('tac')) category = 'Tomografia';
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(exam);
  });
  
  return grouped;
}

const categoryConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  'Exames de Sangue': {
    color: 'from-red-500 to-rose-600',
    icon: <Droplets className="h-5 w-5 text-white" />
  },
  'Exames de Fezes': {
    color: 'from-amber-500 to-orange-600',
    icon: <Microscope className="h-5 w-5 text-white" />
  },
  'Exames de Urina': {
    color: 'from-yellow-500 to-amber-600',
    icon: <Activity className="h-5 w-5 text-white" />
  },
  'Raio-X': {
    color: 'from-purple-500 to-violet-600',
    icon: <ScanLine className="h-5 w-5 text-white" />
  },
  'Tomografia': {
    color: 'from-blue-500 to-cyan-600',
    icon: <Bone className="h-5 w-5 text-white" />
  },
  'Outros': {
    color: 'from-gray-500 to-slate-600',
    icon: <FileText className="h-5 w-5 text-white" />
  }
};

async function getHistoryPageData(patientId: string): Promise<{ exams: Exam[], error?: string, fixUrl?: string }> {
    try {
        const exams = await getExamsByPatientId(patientId);
        return { exams };
    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = e.code?.toLowerCase() || '';
        
        if (errorMessage.includes('connection') || errorCode.includes('not-found')) {
            return { 
                exams: [],
                error: "Não foi possível conectar ao banco de dados. Verifique se o banco de dados está configurado corretamente."
            };
        }
        console.error("Unexpected error fetching exam history:", e);
        return { exams: [], error: "Ocorreu um erro inesperado ao carregar seu histórico de exames." };
    }
}


export default async function ExamHistoryPage() {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
      redirect('/login');
  }

  const { exams, error, fixUrl } = await getHistoryPageData(session.userId);
  const groupedExams = groupExamsByType(exams);
  const hasExams = exams.length > 0;

  return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Histórico de Exames
          </h1>
          <p className="text-muted-foreground">
            Visualize a evolução dos seus exames ao longo do tempo e acesse análises detalhadas.
          </p>
        </div>

        {error ? (
           <div className="container mx-auto">
               <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Erro de Configuração ou Conexão</AlertTitle>
                   <AlertDescription>
                       {error}
                       {fixUrl && (
                           <p className="mt-2">
                               Por favor, habilite a API manualmente visitando o seguinte link e clicando em "Habilitar":
                               <br />
                               <Link href={fixUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                                   Habilitar API do Firestore
                               </Link>
                               <br />
                               <span className="text-xs">Após habilitar, aguarde alguns minutos e atualize esta página.</span>
                           </p>
                       )}
                   </AlertDescription>
               </Alert>
           </div>
        ) : hasExams ? (
          <Tabs defaultValue="charts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="charts">Gráficos de Evolução</TabsTrigger>
              <TabsTrigger value="list">Lista de Exames</TabsTrigger>
            </TabsList>
            
            <TabsContent value="charts" className="space-y-6">
              {Object.entries(groupedExams).map(([category, categoryExams]) => {
                const config = categoryConfig[category] || categoryConfig['Outros'];
                return (
                  <ExamTimelineChart
                    key={category}
                    exams={categoryExams}
                    examType={category}
                    color={config.color}
                    icon={config.icon}
                  />
                );
              })}
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              {exams.map((exam) => (
                <Card key={exam.id} className="transition-all hover:shadow-md hover:border-primary flex items-center pr-4">
                    <Link href={`/patient/history/${exam.id}`} className="flex-grow">
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
                    </Link>
                    <DeleteExamButton patientId={session.userId} examId={exam.id} />
                </Card>
              ))}
            </TabsContent>
          </Tabs>
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
  );
}
