import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer, CheckCircle, BotMessageSquare, AlertTriangle, Lightbulb } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AudioPlayback from "@/components/patient/audio-playback";
import { getExamById, getPatientById } from "@/lib/db-adapter";
import { notFound, redirect } from "next/navigation";
import PrintButton from "@/components/patient/print-button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import type { Exam, Patient } from "@/types";
import { getSession } from "@/lib/session";
import SpecialistFindingsDisplay from "@/components/patient/specialist-findings-display";

// Component to parse and render suggestions with proper formatting
const RenderSuggestions = ({ suggestions }: { suggestions: string }) => {
  const lines = suggestions.split('\n').filter(line => line.trim() !== '');

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        
        // Main section heading (e.g., "**A. PLANO MEDICAMENTOSO:**")
        if (trimmed.startsWith('**') && trimmed.includes(':**')) {
          const title = trimmed.replace(/\*\*/g, '').replace(/:/g, '');
          return (
            <h3 key={index} className="font-bold text-lg text-amber-600 dark:text-amber-300 mt-6 first:mt-0 border-b border-amber-500/30 pb-2">
              {title}
            </h3>
          );
        }
        
        // Sub-heading (e.g., "**Medicamentos Cardiovasculares:**")
        if (trimmed.startsWith('**') && trimmed.endsWith(':**')) {
          const title = trimmed.replace(/\*\*/g, '').replace(/:/g, '');
          return (
            <h4 key={index} className="font-semibold text-base text-amber-700 dark:text-amber-200 mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
              {title}
            </h4>
          );
        }
        
        // Bullet point (starts with "- ")
        if (trimmed.startsWith('- ')) {
          const content = trimmed.substring(2);
          // Check if content has bold parts
          const parts = content.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={index} className="pl-6 text-foreground dark:text-slate-300 leading-relaxed text-sm border-l-2 border-amber-600/40 dark:border-amber-500/30">
              {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i} className="font-semibold text-amber-700 dark:text-amber-200">{part.slice(2, -2)}</strong>;
                }
                return <span key={i}>{part}</span>;
              })}
            </p>
          );
        }
        
        // Regular paragraph
        if (trimmed.length > 0) {
          return (
            <p key={index} className="text-foreground dark:text-slate-300 leading-relaxed text-sm">
              {trimmed}
            </p>
          );
        }
        
        return null;
      })}
    </div>
  );
};

async function getExamPageData(patientId: string, examId: string): Promise<{ patient: Patient | null, examData: Exam | null, error?: string, fixUrl?: string }> {
    try {
        const patient = await getPatientById(patientId);
        const examData = await getExamById(patientId, examId);
        if (!patient || !examData) {
            notFound();
        }
        return { patient, examData };
    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = e.code?.toLowerCase() || '';

        if (errorMessage.includes('connection') || errorCode.includes('not-found')) {
            return { 
                patient: null, examData: null,
                error: "Não foi possível conectar ao banco de dados. Verifique se o banco de dados está configurado corretamente."
            };
        }
        console.error(`Unexpected error fetching exam ${examId}:`, e);
        return { patient: null, examData: null, error: "Ocorreu um erro inesperado ao carregar os detalhes do exame." };
    }
}


export default async function ExamDetailPage({ params }: { params: { examId: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
      redirect('/login');
  }

  const { patient, examData, error, fixUrl } = await getExamPageData(session.userId, params.examId);

  if (error || !examData || !patient) {
     return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao Carregar Detalhes do Exame</AlertTitle>
                <AlertDescription>
                    {error || "Os dados do exame ou do paciente não puderam ser carregados."}
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
    )
  }

  const isExamValidated = examData.status === 'Validado';
  const examDate = new Date(examData.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const textForMainAudio = `${examData.preliminaryDiagnosis}. ${examData.explanation}`;


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">

          {/* Main Card for AI Analysis of the specific exam */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2 text-foreground">
                    {isExamValidated ? <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" /> : <BotMessageSquare className="h-6 w-6 text-primary dark:text-cyan-400" />}
                    {isExamValidated ? "Diagnóstico Final Validado pelo Médico" : "Análise Preliminar do Exame pela IA"}
                  </CardTitle>
                  <CardDescription className="text-foreground/70 dark:text-muted-foreground">{examData.type} - {examDate}</CardDescription>
                </div>
                 <PrintButton />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {isExamValidated ? (
                // Show Doctor's validated diagnosis
                <div className="space-y-4">
                  <AudioPlayback 
                    textToSpeak={examData.finalExplanation || examData.doctorNotes || ""} 
                    preGeneratedAudioUri={examData.finalExplanationAudioUri} 
                  />
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Diagnóstico Validado</h3>
                    <p className="text-foreground dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{examData.doctorNotes}</p>
                  </div>
                  {examData.finalExplanation && (
                    <div>
                      <h3 className="font-semibold text-lg mt-4 text-foreground">Explicação e Próximos Passos</h3>
                      <p className="text-foreground dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{examData.finalExplanation}</p>
                    </div>
                  )}
                   <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle>Este é o parecer final do seu médico</AlertTitle>
                      <AlertDescription>
                          Esta análise foi validada por um profissional qualificado. Siga as recomendações e entre em contato se tiver dúvidas.
                      </AlertDescription>
                  </Alert>
                </div>
              ) : (
                // Show AI's preliminary analysis
                 <div className="space-y-4">
                    <AudioPlayback textToSpeak={textForMainAudio} />

                    {/* Diagnóstico Preliminar Card */}
                    <div className="rounded-lg border border-primary/30 bg-primary/5 dark:bg-gradient-to-br dark:from-cyan-500/10 dark:to-blue-500/10 p-6 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-primary/20 dark:bg-primary/30">
                          <BotMessageSquare className="h-5 w-5 text-primary dark:text-cyan-400" />
                        </div>
                        <h3 className="font-semibold text-lg text-foreground dark:text-slate-200">Diagnóstico Preliminar da IA</h3>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <RenderSuggestions suggestions={examData.preliminaryDiagnosis} />
                      </div>
                    </div>

                    {/* Explicação Detalhada Card */}
                    <div className="rounded-lg border border-accent/30 bg-accent/5 dark:bg-gradient-to-br dark:from-blue-500/10 dark:to-purple-500/10 p-6 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-accent/20 dark:bg-accent/30">
                          <FileText className="h-5 w-5 text-accent dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-lg text-foreground dark:text-slate-200">Explicação Detalhada</h3>
                      </div>
                      <p className="text-foreground dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{examData.explanation}</p>
                    </div>

                    {/* Sugestões e Próximos Passos Card */}
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 dark:bg-gradient-to-br dark:from-amber-500/10 dark:to-orange-500/10 p-6 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-amber-500/20 dark:bg-amber-500/30">
                          <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="font-semibold text-lg text-foreground dark:text-amber-100">Sugestões e Próximos Passos</h3>
                      </div>
                      <AudioPlayback textToSpeak={examData.suggestions || ""}/>
                      <div className="mt-3">
                        <RenderSuggestions suggestions={examData.suggestions || ""} />
                      </div>
                    </div>

                    {/* Specialist Findings Section */}
                    {examData.specialistFindings && examData.specialistFindings.length > 0 && (
                      <SpecialistFindingsDisplay findings={examData.specialistFindings} />
                    )}

                    {/* Alert de Aviso */}
                    <Alert variant="destructive" className="border-red-500/50 bg-red-950/50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção: Este é um Diagnóstico da IA</AlertTitle>
                      <AlertDescription>
                          Este diagnóstico é uma ferramenta auxiliar e não substitui a avaliação de um médico humano. A validação e a prescrição final devem ser feitas por um profissional qualificado.
                      </AlertDescription>
                    </Alert>
                 </div>
              )}
            </CardContent>
          </Card>

        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Resultados do Exame</CardTitle>
            </CardHeader>
            <CardContent>
             {examData.results && examData.results.length > 0 ? (
                <ul className="space-y-2">
                  {examData.results.map(res => (
                    <li key={res.name} className="flex justify-between border-b pb-2">
                      <span className="text-sm font-medium text-foreground">{res.name}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{res.value}</p>
                        <p className="text-xs text-foreground/70 dark:text-muted-foreground">Ref: {res.reference}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground/70 dark:text-muted-foreground">Nenhum resultado detalhado disponível para este exame.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}