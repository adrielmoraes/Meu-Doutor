
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Bot, FileText, User, Pen, CheckCircle, Send, Loader2, FileWarning, Files } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Patient, Exam } from "@/types";
import { validateExamDiagnosisAction, saveDraftNotesAction } from "@/app/doctor/patients/[id]/actions";
import { Badge } from "../ui/badge";
import AudioPlayback from "../patient/audio-playback";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

type PatientDetailViewProps = {
  patient: Patient;
  summary: string;
  exams: Exam[];
};

type ExamValidationState = {
  [examId: string]: {
    notes: string;
    isSaving: boolean;
    isValidating: boolean;
  };
};

export default function PatientDetailView({
  patient,
  summary,
  exams,
}: PatientDetailViewProps) {
  const { toast } = useToast();

  // Initialize state for each exam
  const initialValidationState = exams.reduce((acc, exam) => {
    acc[exam.id] = {
      notes: exam.doctorNotes || exam.preliminaryDiagnosis || "",
      isSaving: false,
      isValidating: false,
    };
    return acc;
  }, {} as ExamValidationState);

  const [validationState, setValidationState] = useState(initialValidationState);

  const handleNotesChange = (examId: string, newNotes: string) => {
    setValidationState(prev => ({
      ...prev,
      [examId]: { ...prev[examId], notes: newNotes },
    }));
  };

  const handleSaveDraft = async (examId: string) => {
    setValidationState(prev => ({ ...prev, [examId]: { ...prev[examId], isSaving: true } }));
    const result = await saveDraftNotesAction(patient.id, examId, validationState[examId].notes);
    toast({
      title: result.success ? "Rascunho Salvo" : "Erro ao Salvar",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    setValidationState(prev => ({ ...prev, [examId]: { ...prev[examId], isSaving: false } }));
  };

  const handleValidateDiagnosis = async (examId: string) => {
    setValidationState(prev => ({ ...prev, [examId]: { ...prev[examId], isValidating: true } }));
    const result = await validateExamDiagnosisAction(patient.id, examId, validationState[examId].notes);
    toast({
      title: result.success ? "Diagnóstico Validado" : "Erro ao Validar",
      description: result.message,
      variant: result.success ? "default" : "destructive",
      className: result.success ? "bg-green-100 text-green-800 border-green-200" : "",
    });
    // State will be updated by page revalidation
    setValidationState(prev => ({ ...prev, [examId]: { ...prev[examId], isValidating: false } }));
  };

  const pendingExams = exams.filter(e => e.status === 'Requer Validação');
  const validatedExams = exams.filter(e => e.status === 'Validado');


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={patient.avatar} data-ai-hint={patient.avatarHint}/>
            <AvatarFallback>{patient.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <CardTitle className="text-3xl">{patient.name}</CardTitle>
            <CardDescription>
              {patient.age} anos, {patient.gender}. Última Interação: {patient.lastVisit}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <Badge variant={patient.status === 'Validado' ? 'secondary' : 'default'} className={`text-base ${patient.status === 'Validado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {patient.status}
            </Badge>
             {patient.status !== 'Validado' && patient.priority && (
                <Badge variant="outline" className="text-sm border-2">
                    Prioridade: <span className="font-bold ml-1">{patient.priority}</span>
                </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column for exams */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileWarning className="h-6 w-6 text-yellow-500" />
                        Exames Pendentes de Validação ({pendingExams.length})
                    </CardTitle>
                    <CardDescription>Revise a análise da IA e forneça seu diagnóstico final para cada exame.</CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingExams.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full" defaultValue={pendingExams[0].id}>
                            {pendingExams.map(exam => {
                                const state = validationState[exam.id];
                                return (
                                <AccordionItem value={exam.id} key={exam.id}>
                                    <AccordionTrigger className="text-base font-medium hover:no-underline">
                                        <div className="flex items-center gap-4">
                                            <Files className="h-5 w-5 text-primary"/>
                                            <span>{exam.type}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-4">
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                            <h4 className="font-semibold text-sm mb-2 text-primary">Análise Preliminar da IA</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{exam.preliminaryDiagnosis}</p>
                                        </div>
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                            <h4 className="font-semibold text-sm mb-2 text-primary">Explicação Simplificada (IA)</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{exam.explanation}</p>
                                        </div>
                                        <div className="pt-4">
                                            <h3 className="font-semibold mb-2">Sua Validação e Prescrição Final</h3>
                                            <Textarea 
                                                placeholder="Edite o diagnóstico e adicione sua prescrição oficial aqui..." 
                                                rows={6}
                                                value={state?.notes || ''}
                                                onChange={(e) => handleNotesChange(exam.id, e.target.value)}
                                            />
                                            <div className="flex gap-2 mt-4">
                                                <Button onClick={() => handleSaveDraft(exam.id)} disabled={state?.isSaving}>
                                                    {state?.isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pen className="mr-2 h-4 w-4" />}
                                                    {state?.isSaving ? "Salvando..." : "Salvar Rascunho"}
                                                </Button>
                                                <Button onClick={() => handleValidateDiagnosis(exam.id)} variant="secondary" disabled={state?.isValidating}>
                                                    {state?.isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                    {state?.isValidating ? "Validando..." : "Validar Diagnóstico"}
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                );
                            })}
                        </Accordion>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Nenhum exame pendente de validação.</p>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        Exames Já Validados ({validatedExams.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     {validatedExams.length > 0 ? (
                        <ul className="space-y-2">
                            {validatedExams.map(exam => (
                                <li key={exam.id} className="p-3 border rounded-md">
                                    <p className="font-semibold">{exam.type}</p>
                                    <p className="text-sm text-muted-foreground truncate">{exam.doctorNotes}</p>
                                </li>
                            ))}
                        </ul>
                     ): (
                        <p className="text-muted-foreground text-center py-4">Nenhum exame foi validado ainda.</p>
                     )}
                </CardContent>
            </Card>
        </div>

        {/* Right column for patient summary */}
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/>Resumo do Paciente</CardTitle>
                <CardDescription>
                    Gerado pela IA a partir das interações do paciente.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-48">
                        <p className="whitespace-pre-wrap leading-relaxed text-sm text-muted-foreground pr-4">{summary}</p>
                    </ScrollArea>
                    <Separator className="my-4" />
                     <h4 className="font-semibold mb-2 text-sm">Dados Brutos Combinados</h4>
                     <ScrollArea className="h-48">
                        <pre className="p-2 bg-muted rounded-md text-xs text-muted-foreground overflow-x-auto pr-4">
                            <code>{patient.examResults || "Nenhum dado bruto registrado."}</code>
                        </pre>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
