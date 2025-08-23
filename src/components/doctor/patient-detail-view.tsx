"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Bot, FileText, User, Pen, CheckCircle, Send, Loader2 } from "lucide-react";
import type { GeneratePreliminaryDiagnosisOutput } from "@/ai/flows/generate-preliminary-diagnosis";
import { useToast } from "@/hooks/use-toast";

type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  examResults: string;
};

type PatientDetailViewProps = {
  patient: Patient;
  summary: string;
  diagnosis: GeneratePreliminaryDiagnosisOutput;
};

export default function PatientDetailView({
  patient,
  summary,
  diagnosis,
}: PatientDetailViewProps) {
  const [doctorNotes, setDoctorNotes] = useState(`${diagnosis.diagnosis}\n\nPrescrição:`);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      // Em uma aplicação real, aqui você salvaria no banco de dados.
      console.log("Draft saved:", doctorNotes);
      toast({
        title: "Rascunho Salvo",
        description: "Suas anotações foram salvas com sucesso.",
      });
      setIsSaving(false);
    }, 1000);
  };

  const handleValidateDiagnosis = () => {
    setIsValidating(true);
    setTimeout(() => {
      // Em uma aplicação real, aqui você marcaria o diagnóstico como validado.
      console.log("Diagnosis validated:", doctorNotes);
      toast({
        title: "Diagnóstico Validado",
        description: `O diagnóstico para ${patient.name} foi validado.`,
        className: "bg-green-100 text-green-800",
      });
      setIsValidating(false);
    }, 1500);
  };

  const handleSendToPatient = () => {
    setIsSending(true);
    setTimeout(() => {
      // Em uma aplicação real, aqui você enviaria uma notificação ao paciente.
      console.log("Sending to patient:", doctorNotes);
      toast({
        title: "Enviado ao Paciente",
        description: `O diagnóstico final foi enviado para ${patient.name}.`,
        className: "bg-blue-100 text-blue-800",
      });
      setIsSending(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="man portrait"/>
            <AvatarFallback>{patient.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-3xl">{patient.name}</CardTitle>
            <CardDescription>
              {patient.age} anos, {patient.gender}. Última Interação: {patient.lastVisit}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="diagnosis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diagnosis">
            <Bot className="mr-2 h-4 w-4" /> Diagnóstico da IA
          </TabsTrigger>
          <TabsTrigger value="summary">
            <User className="mr-2 h-4 w-4" /> Resumo do Paciente
          </TabsTrigger>
          <TabsTrigger value="raw_data">
            <FileText className="mr-2 h-4 w-4" /> Dados Brutos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise e Diagnóstico Preliminar da IA</CardTitle>
              <CardDescription>
                Esta é a interpretação e sugestão da IA baseada nos dados fornecidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Diagnóstico Preliminar</h3>
                <p className="text-muted-foreground">{diagnosis.diagnosis}</p>
              </div>
              <div>
                <h3 className="font-semibold">Sugestões e Próximos Passos</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{diagnosis.suggestions}</p>
              </div>

              <div className="pt-4 border-t">
                 <h3 className="font-semibold mb-2">Validação e Prescrição Final</h3>
                 <Textarea 
                   placeholder="Edite o diagnóstico e adicione sua prescrição oficial aqui..." 
                   rows={5}
                   value={doctorNotes}
                   onChange={(e) => setDoctorNotes(e.target.value)}
                 />
                 <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveDraft} disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pen className="mr-2 h-4 w-4" />}
                      {isSaving ? "Salvando..." : "Salvar Rascunho"}
                    </Button>
                    <Button onClick={handleValidateDiagnosis} variant="secondary" disabled={isValidating}>
                      {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      {isValidating ? "Validando..." : "Validar Diagnóstico"}
                    </Button>
                    <Button onClick={handleSendToPatient} className="bg-green-600 hover:bg-green-700" disabled={isSending}>
                      {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      {isSending ? "Enviando..." : "Enviar ao Paciente"}
                    </Button>
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Executivo do Caso</CardTitle>
              <CardDescription>
                Gerado pela IA a partir das interações do paciente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{summary}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="raw_data" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Exames Brutos</CardTitle>
              <CardDescription>
                A informação original do exame carregado pelo paciente.
              </CardDescription>
            </Header>
            <CardContent>
              <pre className="p-4 bg-muted rounded-md text-sm text-muted-foreground overflow-x-auto">
                <code>{patient.examResults}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
