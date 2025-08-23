import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AudioPlayback from "@/components/patient/audio-playback";
import { getExamById, getPatientById } from "@/lib/firestore-adapter";
import { notFound } from "next/navigation";
import { explainDiagnosisToPatient } from "@/ai/flows/explain-diagnosis-flow";
import { BotMessageSquare } from "lucide-react";

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

export default async function ExamDetailPage({ params }: { params: { examId: string } }) {
  const patient = await getPatientById(MOCK_PATIENT_ID);
  const examData = await getExamById(MOCK_PATIENT_ID, params.examId);

  if (!examData || !patient) {
    notFound();
  }

  const isDiagnosisValidated = patient.status === 'Validado' && !!patient.doctorNotes;

  let title = "Análise Preliminar do Exame pela IA";
  let diagnosis = examData.preliminaryDiagnosis;
  let explanation = examData.explanation;
  let audioToPlay: string | null = null;
  
  // Logic to determine which text to use for audio playback
  const textForAudio = `Diagnóstico: ${diagnosis}. Explicação: ${explanation}`;


  if (isDiagnosisValidated) {
    title = "Diagnóstico Final Validado pelo Médico";
    // We check if the doctor's notes for THIS specific exam context exist.
    // In a more complex app, you might match the exam to a specific diagnosis note.
    // For this prototype, we'll assume the latest note applies.
    const finalExplanation = await explainDiagnosisToPatient({ diagnosisAndNotes: patient.doctorNotes! });
    diagnosis = patient.doctorNotes!.split('\n')[0] || "Diagnóstico Final";
    explanation = finalExplanation.explanation;
    audioToPlay = finalExplanation.audioDataUri; // Use the pre-generated audio for the final diagnosis
  }

  const examDate = new Date(examData.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {isDiagnosisValidated ? <CheckCircle className="h-6 w-6 text-green-600" /> : <BotMessageSquare className="h-6 w-6 text-primary" />} 
                        {title}
                      </CardTitle>
                      <CardDescription>{examData.type} - {examDate}</CardDescription>
                    </div>
                     <Button variant="outline" onClick={() => typeof window !== 'undefined' && window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AudioPlayback textToSpeak={explanation} preGeneratedAudioUri={audioToPlay} />
                  <div>
                    <h3 className="font-semibold text-lg">{isDiagnosisValidated ? "Diagnóstico Validado" : "Diagnóstico Preliminar da IA"}</h3>
                    <p className="text-xl text-primary font-bold">{diagnosis}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{isDiagnosisValidated ? "Explicação e Próximos Passos" : "Explicação Detalhada"}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{explanation}</p>
                  </div>
                </CardContent>
              </Card>

              <Alert variant={isDiagnosisValidated ? "default" : "destructive"} className={isDiagnosisValidated ? "bg-green-50 border-green-200 text-green-800" : ""}>
                 {isDiagnosisValidated ? <CheckCircle className="h-4 w-4" /> : <BotMessageSquare className="h-4 w-4" />}
                <AlertTitle>{isDiagnosisValidated ? "Este é o parecer final do seu médico" : "Atenção: Este é um Diagnóstico da IA"}</AlertTitle>
                <AlertDescription>
                  {isDiagnosisValidated 
                    ? "Esta análise foi validada por um profissional qualificado. Siga as recomendações e entre em contato se tiver dúvidas."
                    : "Este diagnóstico é uma ferramenta auxiliar e não substitui a avaliação de um médico humano. A validação e a prescrição final devem ser feitas por um profissional qualificado."
                  }
                </AlertDescription>
              </Alert>

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
      </main>
    </div>
  );
}
