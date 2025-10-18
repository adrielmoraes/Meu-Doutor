
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
        // Check if the line is a main heading (e.g., "- **Medicação:**")
        if (line.trim().startsWith('- **') && line.trim().endsWith('**')) {
          const title = line.replace(/- \*\*/g, '').replace(/\*\*:/g, '').replace(/\*\*/g, '');
          return (
            <h4 key={index} className="font-semibold text-base text-amber-200 mt-4 first:mt-0 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {title}
            </h4>
          );
        }
        // Render other lines as list items
        return (
          <p key={index} className="pl-6 text-slate-300 leading-relaxed text-sm border-l-2 border-amber-500/30">
            {line.replace(/^-/, '').trim()}
          </p>
        );
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
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {isExamValidated ? <CheckCircle className="h-6 w-6 text-green-600" /> : <BotMessageSquare className="h-6 w-6 text-primary" />}
                    {isExamValidated ? "Diagnóstico Final Validado pelo Médico" : "Análise Preliminar do Exame pela IA"}
                  </CardTitle>
                  <CardDescription>{examData.type} - {examDate}</CardDescription>
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
                    <h3 className="font-semibold text-lg">Diagnóstico Validado</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{examData.doctorNotes}</p>
                  </div>
                  {examData.finalExplanation && (
                    <div>
                      <h3 className="font-semibold text-lg mt-4">Explicação e Próximos Passos</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{examData.finalExplanation}</p>
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
                    <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-cyan-500/20">
                          <BotMessageSquare className="h-5 w-5 text-cyan-400" />
                        </div>
                        <h3 className="font-semibold text-lg text-cyan-100">Diagnóstico Preliminar da IA</h3>
                      </div>
                      <p className="text-xl text-cyan-300 font-bold leading-relaxed">{examData.preliminaryDiagnosis}</p>
                    </div>

                    {/* Explicação Detalhada Card */}
                    <div className="rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-lg text-blue-100">Explicação Detalhada</h3>
                      </div>
                      <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{examData.explanation}</p>
                    </div>

                    {/* Sugestões e Próximos Passos Card */}
                    <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                          <Lightbulb className="h-5 w-5 text-amber-400" />
                        </div>
                        <h3 className="font-semibold text-lg text-amber-100">Sugestões e Próximos Passos</h3>
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
              <CardTitle>Resultados do Exame</CardTitle>
            </CardHeader>
            <CardContent>
             {examData.results && examData.results.length > 0 ? (
                <ul className="space-y-2">
                  {examData.results.map(res => (
                    <li key={res.name} className="flex justify-between border-b pb-2">
                      <span className="text-sm font-medium">{res.name}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{res.value}</p>
                        <p className="text-xs text-muted-foreground">Ref: {res.reference}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum resultado detalhado disponível para este exame.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
