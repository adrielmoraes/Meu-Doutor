"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, FileText, User, Pen, CheckCircle, Send, Loader2, FileWarning, Files, Sparkles, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Patient, Exam } from "@/types";
import { validateExamDiagnosisAction, saveDraftNotesAction } from "@/app/doctor/patients/[id]/actions";
import { Badge } from "../ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { generatePreliminaryDiagnosis } from "@/ai/flows/generate-preliminary-diagnosis";
import type { GeneratePreliminaryDiagnosisOutput } from "@/ai/flows/generate-preliminary-diagnosis";
import { Textarea } from "../ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type PatientDetailViewProps = {
  patient: Patient;
  summary: string;
  exams: Exam[];
};

function AIAnalysisCollapsible({ exam }: { exam: Exam }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-lg border border-cyan-500/30 overflow-hidden">
      <CollapsibleTrigger asChild>
        <button className="w-full p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 transition-colors flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-cyan-400" />
            <h4 className="font-semibold text-lg text-cyan-300">Análise Preliminar da IA</h4>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-cyan-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-cyan-400" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 bg-slate-800/30">
          <div className="max-h-[500px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-slate-700/30 hover:scrollbar-thumb-cyan-500/70"
               style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(6, 182, 212, 0.5) rgba(51, 65, 85, 0.3)' }}>
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-cyan-300 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
              prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
              prose-p:text-white prose-p:leading-relaxed prose-p:my-2
              prose-strong:text-cyan-200 prose-strong:font-semibold
              prose-ul:my-2 prose-ul:pl-4 prose-li:text-white prose-li:my-1
              prose-ol:my-2 prose-ol:pl-4
              prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
              prose-code:text-cyan-300 prose-code:bg-slate-700/50 prose-code:px-1 prose-code:rounded
              prose-blockquote:border-l-cyan-500 prose-blockquote:text-blue-200
              prose-hr:border-slate-600">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {exam.preliminaryDiagnosis || "Nenhuma análise disponível."}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

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

                                        <AIAnalysisCollapsible exam={exam} />

                                        <div className="p-4 border rounded-lg bg-slate-800/50">
                                            <h3 className="font-bold text-xl mb-3 text-cyan-300">Seu Diagnóstico e Validação</h3>
                                            <Button
                                                onClick={() => handleGenerateDiagnosis(exam.id)}
                                                disabled={state?.isGenerating}
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 transition-all mb-4 w-full text-base"
                                            >
                                                {state?.isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                                {state?.isGenerating ? "Consultando Especialistas..." : "Gerar Parecer da Equipe de IAs"}
                                            </Button>

                                            {state?.generatedDiagnosis && (
                                                <div className="p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg mb-4 border border-purple-500/30">
                                                    <h4 className="font-bold text-lg mb-4 text-purple-300 flex items-center gap-2">
                                                        <Sparkles className="h-5 w-5" />
                                                        Pareceres da Equipe de IAs
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {state.generatedDiagnosis.structuredFindings.map(finding => (
                                                            <div key={finding.specialist} className="border-l-4 border-purple-500/50 pl-4 py-2 bg-slate-800/30 rounded-r-lg">
                                                                <h5 className="font-bold text-purple-200 mb-2">{finding.specialist}</h5>
                                                                <div className="prose prose-invert prose-sm max-w-none
                                                                  prose-headings:text-purple-300 prose-headings:font-bold prose-headings:mt-2 prose-headings:mb-1
                                                                  prose-p:text-white prose-p:leading-relaxed prose-p:my-1
                                                                  prose-strong:text-purple-200 prose-strong:font-semibold
                                                                  prose-ul:my-1 prose-ul:pl-4 prose-li:text-white prose-li:my-0.5
                                                                  prose-ol:my-1 prose-ol:pl-4
                                                                  prose-code:text-purple-300 prose-code:bg-slate-700/50 prose-code:px-1 prose-code:rounded">
                                                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {finding.findings}
                                                                  </ReactMarkdown>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <Textarea
                                                placeholder="Clique em 'Gerar Parecer' para que a IA crie um rascunho. Edite o diagnóstico e adicione sua prescrição oficial aqui..."
                                                rows={8}
                                                value={state?.notes || ''}
                                                onChange={(e) => handleNotesChange(exam.id, e.target.value)}
                                            />
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    onClick={() => handleSaveDraft(exam.id)}
                                                    disabled={state?.isSaving || !state?.notes}
                                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30 transition-all"
                                                >
                                                    {state?.isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-cyan-300"><User className="h-6 w-6"/>Resumo do Paciente</CardTitle>
                <CardDescription className="text-base text-blue-200/70">
                    Gerado pela IA a partir das interações do paciente.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[300px] overflow-y-auto pr-3"
                         style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(6, 182, 212, 0.5) rgba(51, 65, 85, 0.3)' }}>
                        <div className="prose prose-invert prose-sm max-w-none
                          prose-headings:text-cyan-300 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1
                          prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                          prose-p:text-white prose-p:leading-relaxed prose-p:my-1.5
                          prose-strong:text-cyan-200 prose-strong:font-semibold
                          prose-ul:my-1 prose-ul:pl-4 prose-li:text-white prose-li:my-0.5
                          prose-ol:my-1 prose-ol:pl-4">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {summary || "Nenhum resumo disponível."}
                          </ReactMarkdown>
                        </div>
                    </div>
                    <Separator className="my-4 bg-slate-600/50" />
                     <h4 className="font-bold mb-3 text-base text-cyan-300">Dados Brutos Combinados</h4>
                     <div className="max-h-[200px] overflow-y-auto"
                          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(6, 182, 212, 0.5) rgba(51, 65, 85, 0.3)' }}>
                        <pre className="p-3 bg-slate-900/50 rounded-md text-sm text-white overflow-x-auto pr-4 leading-relaxed border border-slate-700/30">
                            <code>{patient.examResults || "Nenhum dado bruto registrado."}</code>
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}