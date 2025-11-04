

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
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-background">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8">
              <TabsTrigger value="timeline" className="text-xs sm:text-sm">Linha do Tempo</TabsTrigger>
              <TabsTrigger value="charts" className="text-xs sm:text-sm">Gráficos</TabsTrigger>
              <TabsTrigger value="list" className="text-xs sm:text-sm">Lista</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="space-y-8">
              {Object.entries(groupedExams).map(([category, categoryExams]) => {
                const config = categoryConfig[category] || categoryConfig['Outros'];
                const sortedExams = [...categoryExams].sort((a, b) => 
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                
                return (
                  <Card key={category} className="bg-card/80 backdrop-blur-sm border-2 border-border/60">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {category}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            {sortedExams.length} {sortedExams.length === 1 ? 'exame realizado' : 'exames realizados'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <div className="px-3 sm:px-6 pb-6">
                      <div className="relative space-y-6">
                        {/* Timeline Line */}
                        <div className="absolute left-3 sm:left-7 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 via-accent/50 to-transparent" />
                        
                        {sortedExams.map((exam, index) => (
                          <div key={exam.id} className="relative pl-8 sm:pl-16">
                            {/* Timeline Dot */}
                            <div className={`absolute left-1 sm:left-5 top-2 w-4 h-4 rounded-full bg-gradient-to-br ${config.color} border-2 border-background`} />
                            
                            <div className="bg-card rounded-lg p-3 sm:p-4 border-2 border-border hover:border-primary/50 transition-all">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground text-sm sm:text-base">{exam.type}</h4>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {new Date(exam.date).toLocaleDateString('pt-BR', { 
                                      day: '2-digit', 
                                      month: 'long', 
                                      year: 'numeric' 
                                    })}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                                    exam.status === 'Validado' 
                                      ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-2 border-green-500/40 dark:border-green-500/60' 
                                      : 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 border-2 border-yellow-500/40 dark:border-yellow-500/60'
                                  }`}>
                                    {exam.status}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Valores Reais do Exame */}
                              {exam.results && exam.results.length > 0 && (
                                <div className="mt-3 p-2 sm:p-3 bg-primary/5 dark:bg-primary/10 border-2 border-primary/30 dark:border-primary/40 rounded-lg">
                                  <h5 className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    Valores do Exame
                                  </h5>
                                  <div className="space-y-2">
                                    {exam.results.map((result, idx) => (
                                      <div key={idx} className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3 p-2 bg-muted/50 rounded border-2 border-border">
                                        <div className="min-w-0">
                                          <p className="text-xs font-medium text-muted-foreground">Parâmetro</p>
                                          <p className="text-xs sm:text-sm font-semibold text-foreground break-words">{result.name}</p>
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-medium text-muted-foreground">Valor</p>
                                          <p className="text-xs sm:text-sm font-bold text-primary break-words">{result.value}</p>
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-medium text-muted-foreground">Referência</p>
                                          <p className="text-xs sm:text-sm font-medium text-foreground break-words">{result.reference}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-3 p-2 sm:p-3 bg-muted/50 rounded border-2 border-border">
                                <p className="text-xs text-muted-foreground mb-1">
                                  {exam.status === 'Validado' ? 'Diagnóstico Final' : 'Análise Preliminar'}
                                </p>
                                <p className="text-xs sm:text-sm text-foreground line-clamp-3">
                                  {exam.status === 'Validado' && exam.finalExplanation 
                                    ? exam.finalExplanation 
                                    : exam.preliminaryDiagnosis}
                                </p>
                              </div>
                              
                              <Link 
                                href={`/patient/history/${exam.id}`}
                                className="mt-3 inline-flex items-center gap-2 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                              >
                                Ver detalhes completos
                                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </TabsContent>
            
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
                <Card key={exam.id} className="bg-card border-2 border-border transition-all hover:shadow-md hover:border-primary flex items-center pr-2 sm:pr-4">
                    <Link href={`/patient/history/${exam.id}`} className="flex-grow">
                        <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                {getIconForExam(exam)}
                                <div>
                                    <CardTitle className="text-sm sm:text-lg text-foreground">{exam.type}</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">{new Date(exam.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                            <p className="text-xs sm:text-sm text-muted-foreground hidden md:block">{exam.result}</p>
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                    </Link>
                    <DeleteExamButton patientId={session.userId} examId={exam.id} />
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-card border-2 border-border">
            <CardHeader>
                <CardTitle className="text-foreground text-base sm:text-xl">Nenhum exame encontrado</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                Você ainda não enviou nenhum exame para análise. Comece fazendo o upload na página principal.
                </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
  );
}
