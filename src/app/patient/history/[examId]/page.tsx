import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer, Volume2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AudioPlayback from "@/components/patient/audio-playback";

// Mock data for a single exam
const examData = {
  id: '1',
  type: 'Exame de Sangue',
  date: '15 de Ago, 2025',
  preliminaryDiagnosis: "Hiperlipidemia Leve",
  explanation: "Os resultados do seu exame de sangue indicam que os níveis de colesterol e triglicerídeos estão um pouco acima do ideal. Isso é conhecido como hiperlipidemia. Não é uma condição alarmante no momento, mas sugere a necessidade de atenção à dieta e ao estilo de vida. Recomendamos discutir com um médico a possibilidade de adotar uma alimentação mais balanceada, rica em fibras e com baixo teor de gorduras saturadas, além da prática regular de exercícios físicos. Manter esses níveis sob controle é importante para a saúde do seu coração a longo prazo.",
  results: [
    { name: 'Colesterol Total', value: '220 mg/dL', reference: '< 200 mg/dL' },
    { name: 'LDL (Colesterol "ruim")', value: '140 mg/dL', reference: '< 130 mg/dL' },
    { name: 'HDL (Colesterol "bom")', value: '45 mg/dL', reference: '> 40 mg/dL' },
    { name: 'Triglicerídeos', value: '180 mg/dL', reference: '< 150 mg/dL' },
  ]
};

const textToSpeak = `Diagnóstico Preliminar: ${examData.preliminaryDiagnosis}. Explicação: ${examData.explanation}`;

export default function ExamDetailPage({ params }: { params: { examId: string } }) {
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
                      <CardDescription>{examData.type} - {examData.date}</CardDescription>
                    </div>
                     <Button variant="outline" onClick={() => window.print()}>
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
