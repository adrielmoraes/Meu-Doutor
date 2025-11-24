
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, FileText, User, Pen, CheckCircle, Send, Loader2, FileWarning, Files, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Patient, Exam } from "@/types";
import { validateExamDiagnosisAction, saveDraftNotesAction } from "@/app/doctor/patients/[id]/actions";
import { Badge } from "../ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { generatePreliminaryDiagnosis } from "@/ai/flows/generate-preliminary-diagnosis";
import type { GeneratePreliminaryDiagnosisOutput } from "@/ai/flows/generate-preliminary-diagnosis";
import { Textarea } from "../ui/textarea";

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
    isGenerating: boolean;
    generatedDiagnosis: GeneratePreliminaryDiagnosisOutput | null;
  };
};

export default function PatientDetailView({
  patient,
  summary,
  exams,
}: PatientDetailViewProps) {
  const { toast } = useToast();

  const initialValidationState = exams.reduce((acc, exam) => {
    acc[exam.id] = {
      notes: exam.doctorNotes || "", // Start with empty notes
      isSaving: false,
      isValidating: false,
      isGenerating: false,
      generatedDiagnosis: null,
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

  const handleGenerateDiagnosis = async (examId: string) => {
    setValidationState(prev => ({ ...prev, [examId]: { ...prev[examId], isGenerating: true, generatedDiagnosis: null } }));
    try {
        const examToAnalyze = exams.find(e => e.id === examId);
        if (!examToAnalyze) throw new Error("Exam not found");

        const result = await generatePreliminaryDiagnosis({
            patientHistory: summary,
            examResults: examToAnalyze.preliminaryDiagnosis + "\n\n" + examToAnalyze.explanation
        });
        
        setValidationState(prev => ({
            ...prev,
            [examId]: {
                ...prev[examId],
                generatedDiagnosis: result,
                notes: `${result.synthesis}\n\nSugestões:\n${result.suggestions}`
            }
        }));

    } catch (error) {
        console.error("Failed to generate diagnosis:", error);
        toast({
            title: "Erro ao Gerar Diagnóstico",
            description: "Não foi possível obter a síntese da equipe de IAs.",
            variant: "destructive",
        });
    } finally {
        setValidationState(prev => ({ ...prev, [examId]: { ...prev[examId], isGenerating: false } }));
    }
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
    if (!validationState[examId].notes) {
        toast({
            title: "Diagnóstico Vazio",
            description: "Por favor, gere ou escreva um diagnóstico antes de validar.",
            variant: "destructive",
        });
        return;
    }
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
                                        {/* Valores Reais do Exame */}
                                        {exam.results && exam.results.length > 0 && (
                                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <h4 className="font-semibold text-sm mb-3 text-blue-900 flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    Valores do Exame
                                                </h4>
                                                <div className="space-y-2">
                                                    {exam.results.map((result, idx) => (
                                                        <div key={idx} className="grid grid-cols-3 gap-2 p-2 bg-white rounded border border-blue-100">
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-700">Parâmetro</p>
                                                                <p className="text-sm font-semibold text-gray-900">{result.name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-700">Valor</p>
                                                                <p className="text-sm font-bold text-blue-700">{result.value}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-700">Referência</p>
                                                                <p className="text-sm font-medium text-gray-700">{result.reference}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-4 bg-muted/50 rounded-lg">
                                            <h4 className="font-semibold text-lg mb-3 text-primary">Análise Preliminar da IA</h4>
                                            <p className="text-base text-white whitespace-pre-wrap leading-relaxed">{exam.preliminaryDiagnosis}</p>
                                        </div>
                                        
                                        <div className="p-4 border rounded-lg">
                                            <h3 className="font-bold text-xl mb-3 text-white">Seu Diagnóstico e Validação</h3>
                                            <Button onClick={() => handleGenerateDiagnosis(exam.id)} disabled={state?.isGenerating} className="mb-4 w-full text-base">
                                                {state?.isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                                {state?.isGenerating ? "Consultando Especialistas..." : "Gerar Parecer da Equipe de IAs"}
                                            </Button>

                                            {state?.generatedDiagnosis && (
                                                <div className="p-4 bg-muted/50 rounded-lg mb-4">
                                                    <h4 className="font-bold text-lg mb-3 text-primary">Pareceres da Equipe de IAs</h4>
                                                    <ul className="space-y-3 text-base">
                                                        {state.generatedDiagnosis.structuredFindings.map(finding => (
                                                            <li key={finding.specialist} className="border-l-2 pl-3 text-white leading-relaxed">
                                                                <span className="font-bold text-white">{finding.specialist}:</span> {finding.findings}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <Textarea 
                                                placeholder="Clique em 'Gerar Parecer' para que a IA crie um rascunho. Edite o diagnóstico e adicione sua prescrição oficial aqui..." 
                                                rows={8}
                                                value={state?.notes || ''}
                                                onChange={(e) => handleNotesChange(exam.id, e.target.value)}
                                            />
                                            <div className="flex gap-2 mt-4">
                                                <Button onClick={() => handleSaveDraft(exam.id)} disabled={state?.isSaving || !state?.notes}>
                                                    {state?.isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pen className="mr-2 h-4 w-4" />}
                                                    {state?.isSaving ? "Salvando..." : "Salvar Rascunho"}
                                                </Button>
                                                <Button onClick={() => handleValidateDiagnosis(exam.id)} variant="secondary" disabled={state?.isValidating || !state?.notes}>
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
                        <Accordion type="single" collapsible className="w-full">
                            {validatedExams.map(exam => (
                                <AccordionItem value={exam.id} key={exam.id}>
                                    <AccordionTrigger className="text-sm font-medium hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <Files className="h-4 w-4 text-green-600"/>
                                            <div className="text-left">
                                                <p className="font-semibold">{exam.type}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(exam.date).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3 pt-3">
                                        {/* Valores Reais do Exame */}
                                        {exam.results && exam.results.length > 0 && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <h4 className="font-semibold text-xs mb-2 text-green-900 flex items-center gap-2">
                                                    <FileText className="h-3 w-3" />
                                                    Valores do Exame
                                                </h4>
                                                <div className="space-y-1.5">
                                                    {exam.results.map((result, idx) => (
                                                        <div key={idx} className="grid grid-cols-3 gap-2 p-1.5 bg-white rounded border border-green-100">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">{result.name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-green-700">{result.value}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">{result.reference}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <h4 className="font-semibold text-xs mb-1 text-primary">Diagnóstico Final</h4>
                                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{exam.doctorNotes}</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
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
                <CardTitle className="flex items-center gap-2 text-xl"><User className="h-6 w-6"/>Resumo do Paciente</CardTitle>
                <CardDescription className="text-base">
                    Gerado pela IA a partir das interações do paciente.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-48">
                        <p className="whitespace-pre-wrap leading-relaxed text-base text-white pr-4">{summary}</p>
                    </ScrollArea>
                    <Separator className="my-4" />
                     <h4 className="font-bold mb-3 text-base text-white">Dados Brutos Combinados</h4>
                     <ScrollArea className="h-48">
                        <pre className="p-3 bg-muted rounded-md text-sm text-white overflow-x-auto pr-4 leading-relaxed">
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
