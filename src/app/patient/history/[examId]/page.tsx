
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer, CheckCircle, BotMessageSquare, AlertTriangle, Lightbulb } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AudioPlayback from "@/components/patient/audio-playback";
import { getExamById, getPatientById } from "@/lib/firestore-adapter";
import { notFound } from "next/navigation";
import PrintButton from "@/components/patient/print-button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

export default async function ExamDetailPage({ params }: { params: { examId: string } }) {
  const patient = await getPatientById(MOCK_PATIENT_ID);
  const examData = await getExamById(MOCK_PATIENT_ID, params.examId);

  if (!examData || !patient) {
    notFound();
  }

  // Check if there is a general validated diagnosis for the patient
  const hasValidatedDiagnosis = patient.status === 'Validado' && !!patient.doctorNotes;

  const examDate = new Date(examData.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const fullTextToSpeak = `${examData.preliminaryDiagnosis}. ${examData.explanation}. ${examData.suggestions}`;

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
                    <BotMessageSquare className="h-6 w-6 text-primary" /> 
                    Análise Preliminar do Exame pela IA
                  </CardTitle>
                  <CardDescription>{examData.type} - {examDate}</CardDescription>
                </div>
                 <PrintButton />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <AudioPlayback textToSpeak={fullTextToSpeak} />
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
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{examData.suggestions}</p>
              </div>
            </CardContent>
          </Card>

          {/* Warning about AI diagnosis */}
          <Alert variant="destructive">
             <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção: Este é um Diagnóstico da IA</AlertTitle>
            <AlertDescription>
                Este diagnóstico é uma ferramenta auxiliar e não substitui a avaliação de um médico humano. A validação e a prescrição final devem ser feitas por um profissional qualificado.
            </AlertDescription>
          </Alert>

           {/* Alert if a final doctor's diagnosis exists */}
          {hasValidatedDiagnosis && (
             <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Diagnóstico Final do Médico Disponível</AlertTitle>
                <AlertDescription>
                    Um médico já validou um diagnóstico final para o seu caso. Ele pode ou não estar relacionado a este exame específico. Para ver o parecer completo, seu plano de bem-estar e as recomendações finais, acesse o seu painel principal.
                    <Button asChild variant="link" className="p-0 h-auto ml-1 text-green-800 font-bold">
                        <Link href="/patient/dashboard">Ir para o Painel</Link>
                    </Button>
                </AlertDescription>
            </Alert>
          )}

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
