
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer, CheckCircle, BotMessageSquare, AlertTriangle, Lightbulb } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AudioPlayback from "@/components/patient/audio-playback";
import { getExamById, getPatientById } from "@/lib/firestore-client-adapter";
import { notFound, redirect } from "next/navigation";
import PrintButton from "@/components/patient/print-button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import type { Exam, Patient } from "@/types";
import { getSession } from "@/lib/session";

// Component to parse and render suggestions with proper formatting
const RenderSuggestions = ({ suggestions }: { suggestions: string }) => {
  const lines = suggestions.split('\n').filter(line => line.trim() !== '');

  return (
    <div className="space-y-4 text-base text-foreground">
      {lines.map((line, index) => {
        // Check if the line is a main heading (e.g., "- **Medicação:**")
        if (line.trim().startsWith('- **') && line.trim().endsWith('**')) {
          const title = line.replace(/- \*\*/g, '').replace(/\*\*:/g, '').replace(/\*\*/g, '');
          return <h4 key={index} className="font-semibold text-lg mt-4">{title}</h4>;
        }
        // Render other lines as list items
        return (
          <p key={index} className="pl-4 text-slate-600">{line.replace(/^-/, '').trim()}</p>
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
        
        if (errorMessage.includes('client is offline') || errorMessage.includes('5 not_found') || errorCode.includes('not-found')) {
            const firestoreApiUrl = `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;
            return { 
                patient: null, examData: null,
                error: "Não foi possível conectar ao banco de dados. A API do Cloud Firestore pode estar desativada ou o cliente está offline.",
                fixUrl: firestoreApiUrl 
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
                 <div className="space-y-6">
                    <AudioPlayback textToSpeak={textForMainAudio} />
                    <div>
                      <h3 className="font-semibold text-lg">Diagnóstico Preliminar da IA</h3>
                      <p className="text-xl text-primary font-bold">{examData.preliminaryDiagnosis}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Explicação Detalhada</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{examData.explanation}</p>
                    </div>
                    <Separator />
                    <div>
                       <h3 className="font-semibold text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-500" /> Sugestões e Próximos Passos</h3>
                       <AudioPlayback textToSpeak={examData.suggestions || ""}/>
                       <RenderSuggestions suggestions={examData.suggestions || ""} />
                    </div>
                     <Alert variant="destructive">
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
