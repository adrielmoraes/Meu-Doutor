import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AudioPlayback from "@/components/patient/audio-playback";
import { getExamById } from "@/lib/firestore-adapter";
import { notFound } from "next/navigation";

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

export default async function ExamDetailPage({ params }: { params: { examId: string } }) {
  const examData = await getExamById(MOCK_PATIENT_ID, params.examId);

  if (!examData) {
    notFound();
  }

  const textToSpeak = `Diagnóstico Preliminar: ${examData.preliminaryDiagnosis}. Explicação: ${examData.explanation}`;
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
                        <FileText className="h-6 w-6" /> Análise do Exame
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
                  <AudioPlayback textToSpeak={textToSpeak} />
                  <div>
                    <h3 className="font-semibold text-lg">Diagnóstico Preliminar da IA</h3>
                    <p className="text-xl text-primary font-bold">{examData.preliminaryDiagnosis}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Explicação Detalhada</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{examData.explanation}</p>
                  </div>
                </CardContent>
              </Card>

              <Alert variant="destructive">
                <AlertTitle>Atenção: Este é um Diagnóstico da IA</AlertTitle>
                <AlertDescription>
                  Este diagnóstico é uma ferramenta auxiliar e não substitui a avaliação de um médico humano. A validação e a prescrição final devem ser feitas por um profissional qualificado.
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
