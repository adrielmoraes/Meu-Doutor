"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Bot, FileText, User, Pen, CheckCircle, Send } from "lucide-react";
import type { GeneratePreliminaryDiagnosisOutput } from "@/ai/flows/generate-preliminary-diagnosis";

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
                 <Textarea placeholder="Edite o diagnóstico e adicione sua prescrição oficial aqui..." rows={5} defaultValue={`${diagnosis.diagnosis}\n\nPrescrição:`} />
                 <div className="flex gap-2 mt-4">
                    <Button><Pen className="mr-2 h-4 w-4" /> Salvar Rascunho</Button>
                    <Button variant="secondary"><CheckCircle className="mr-2 h-4 w-4" /> Validar Diagnóstico</Button>
                    <Button className="bg-green-600 hover:bg-green-700"><Send className="mr-2 h-4 w-4" /> Enviar ao Paciente</Button>
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
            </CardHeader>
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
