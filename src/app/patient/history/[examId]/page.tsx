
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AudioPlayback from "@/components/patient/audio-playback";
import { getExamById, getPatientById } from "@/lib/firestore-adapter";
import { notFound } from "next/navigation";
import { BotMessageSquare } from "lucide-react";
import PrintButton from "@/components/patient/print-button";

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

export default async function ExamDetailPage({ params }: { params: { examId: string } }) {
  const patient = await getPatientById(MOCK_PATIENT_ID);
  const examData = await getExamById(MOCK_PATIENT_ID, params.examId);

  if (!examData || !patient) {
    notFound();
  }

  // A diagnosis is considered validated for this context if the patient object has been validated.
  // A more complex app could link a specific exam to a specific validation event.
  const isDiagnosisValidated = patient.status === 'Validado' && !!patient.doctorNotes;

  let title = "Análise Preliminar do Exame pela IA";
  let diagnosisText = examData.preliminaryDiagnosis;
  let explanationText = examData.explanation;
  let audioToPlay: string | null = null;
  
  if (isDiagnosisValidated) {
    title = "Diagnóstico Final Validado pelo Médico";
    diagnosisText = patient.doctorNotes!.split('\n')[0] || "Diagnóstico Final"; // Extract first line as title
    explanationText = patient.finalExplanation || "Seu médico validou este diagnóstico. Siga as orientações.";
    audioToPlay = patient.finalExplanationAudioUri || null; // Use the pre-generated audio for the final diagnosis
  }

  const examDate = new Date(examData.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
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
                 <PrintButton />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AudioPlayback textToSpeak={explanationText} preGeneratedAudioUri={audioToPlay} />
              <div>
                <h3 className="font-semibold text-lg">{isDiagnosisValidated ? "Diagnóstico Validado" : "Diagnóstico Preliminar da IA"}</h3>
                <p className="text-xl text-primary font-bold">{diagnosisText}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{isDiagnosisValidated ? "Explicação e Próximos Passos" : "Explicação Detalhada"}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{explanationText}</p>
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
  );
}
