"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, FileText, User, Pen, CheckCircle, Send, Loader2, FileWarning, Files, Sparkles, Save, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Patient, Exam } from "@/types";
import { validateExamDiagnosisAction, saveDraftNotesAction, validateMultipleExamsAction } from "@/app/doctor/patients/[id]/actions";
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
import PatientSafetyBar from "./patient-safety-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientTimeline from "./patient-timeline";
import DiagnosisMacros from "./diagnosis-macros";
import PrescriptionHelper from "./prescription-helper";
import { Filter, ExternalLink, CheckSquare, Stethoscope, FileSignature, Eye, EyeOff, Maximize2, X, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import SoapEvolutionModal from "./soap-evolution-modal";
import PrescriptionModal from "./prescription-modal";
import type { Consultation, Prescription } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PatientDetailViewProps = {
  patient: Patient;
  summary: string;
  exams: Exam[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  doctor: { id: string };
};

const getExamCategory = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('sangue') || t.includes('hemograma') || t.includes('colesterol') || t.includes('glicose') || t.includes('urina') || t.includes('creatinina') || t.includes('tgo') || t.includes('tgp')) return 'Laboratório';
  if (t.includes('raio') || t.includes('x') || t.includes('tomografia') || t.includes('ressonancia') || t.includes('ultrassom') || t.includes('usg')) return 'Imagem';
  if (t.includes('cardio') || t.includes('ecg') || t.includes('eletro') || t.includes('holter') || t.includes('mapa')) return 'Cardiologia';
  return 'Outros';
};

function AIAnalysisCollapsible({ exam }: { exam: Exam }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl border border-blue-100 overflow-hidden shadow-sm">
      <CollapsibleTrigger asChild>
        <button className="w-full p-4 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100/50 hover:to-white transition-colors flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <h4 className="font-bold text-lg text-slate-900 tracking-tight">Análise Preliminar da IA</h4>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-5 bg-white border-t border-blue-50">
          <div className="max-h-[500px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
            <div className="prose prose-slate prose-sm max-w-none
              prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
              prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
              prose-p:text-slate-600 prose-p:leading-relaxed prose-p:my-2
              prose-strong:text-slate-900 prose-strong:font-bold
              prose-ul:my-2 prose-ul:pl-4 prose-li:text-slate-600 prose-li:my-1
              prose-ol:my-2 prose-ol:pl-4
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded
              prose-blockquote:border-l-blue-500 prose-blockquote:text-slate-500
              prose-hr:border-slate-100">
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
  consultations,
  prescriptions,
  doctor,
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isBulkValidating, setIsBulkValidating] = useState(false);
  const [expandedDocuments, setExpandedDocuments] = useState<Record<string, boolean>>({});
  const [fullscreenDocument, setFullscreenDocument] = useState<{ url: string; title: string } | null>(null);

  const toggleDocumentExpand = (examId: string) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [examId]: !prev[examId]
    }));
  };

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url) || url.includes('image');
  };

  const isPdfUrl = (url: string) => {
    return /\.pdf$/i.test(url) || url.includes('pdf');
  };

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
        patientId: patient.id,
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
    setValidationState(prev => ({ ...prev, [examId]: { ...prev[examId], isValidating: false } }));
  };

  const handleBulkValidation = async () => {
    if (selectedExams.length === 0) return;

    setIsBulkValidating(true);
    const result = await validateMultipleExamsAction(patient.id, selectedExams);

    toast({
      title: result.success ? "Validação em Lote Concluída" : "Erro na Validação",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      setSelectedExams([]);
    }
    setIsBulkValidating(false);
  };

  const toggleExamSelection = (examId: string) => {
    setSelectedExams(prev =>
      prev.includes(examId)
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const pendingExams = exams.filter(e => e.status === 'Requer Validação' && (!selectedCategory || getExamCategory(e.type) === selectedCategory));
  const validatedExams = exams.filter(e => e.status === 'Validado' && (!selectedCategory || getExamCategory(e.type) === selectedCategory));

  const categories = Array.from(new Set(exams.map(e => getExamCategory(e.type))));

  return (
    <div className="space-y-6 bg-slate-50 p-1 rounded-xl">
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden border-none ring-1 ring-slate-200">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 border-b border-slate-50">
          <Avatar className="h-24 w-24 border-4 border-white shadow-md">
            <AvatarImage src={patient.avatar} data-ai-hint={patient.avatarHint} />
            <AvatarFallback className="bg-slate-100 text-slate-600 text-xl font-bold">{patient.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <CardTitle className="text-4xl font-extrabold text-slate-900 tracking-tight">{patient.name}</CardTitle>
            <CardDescription className="text-slate-500 text-lg mt-1 font-medium">
              {patient.age} anos • {patient.gender} • Última Interação: {patient.lastVisit}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SoapEvolutionModal patientId={patient.id} patientName={patient.name} />
            <PrescriptionModal
              doctor={doctor}
              patients={[patient]}
              initialPatientId={patient.id}
            />
            <div className="flex flex-col sm:items-end gap-1.5 ml-2">
              <Badge variant={patient.status === 'Validado' ? 'secondary' : 'default'} className={`text-sm px-4 py-1.5 font-bold shadow-sm ${patient.status === 'Validado' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none' : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-none'}`}>
                {patient.status}
              </Badge>
              {patient.priority && (
                <Badge variant="outline" className="text-[10px] font-bold px-3 py-1 border-slate-200 text-slate-600 bg-white">
                  Prioridade: <span className="ml-1 text-slate-900">{patient.priority}</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>


      <PatientSafetyBar
        preventiveAlerts={patient.preventiveAlerts || []}
        allergies={patient.reportedSymptoms?.toLowerCase().includes("alergia") ? ["Verificar Histórico"] : []}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full h-9 px-5 text-xs font-bold shadow-sm transition-all ${selectedCategory === null ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              Todos
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full h-9 px-5 text-xs font-bold shadow-sm transition-all ${selectedCategory === cat ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {cat}
              </Button>
            ))}
          </div>


          <Card className="bg-white border-slate-200 shadow-sm border-none ring-1 ring-slate-200">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-slate-900 justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <FileWarning className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="font-bold">Exames Pendentes ({pendingExams.length})</span>
                </div>
                {selectedExams.length > 0 && (
                  <Button
                    onClick={handleBulkValidation}
                    disabled={isBulkValidating}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md animate-in fade-in zoom-in"
                  >
                    {isBulkValidating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
                    Validar ({selectedExams.length}) Selecionados
                  </Button>
                )}
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">Revise a análise da IA e forneça seu diagnóstico final para cada exame.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {pendingExams.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={pendingExams[0].id}>
                  {pendingExams.map(exam => {
                    const state = validationState[exam.id];
                    return (
                      <AccordionItem value={exam.id} key={exam.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm px-1 bg-white">
                        <AccordionTrigger className="text-base font-bold hover:no-underline text-slate-900 hover:text-blue-600 px-4 py-4 transition-all">
                          <div className="flex items-center gap-4 w-full">
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                              <Checkbox
                                checked={selectedExams.includes(exam.id)}
                                onCheckedChange={() => toggleExamSelection(exam.id)}
                                className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-5 w-5"
                              />
                            </div>
                            <Files className="h-5 w-5 text-blue-500" />
                            <span className="tracking-tight">{exam.type}</span>
                            {exam.fileUrl && (
                              <button
                                className={`ml-auto text-xs font-bold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full border ${
                                  expandedDocuments[exam.id]
                                    ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700'
                                    : 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDocumentExpand(exam.id);
                                }}
                              >
                                {expandedDocuments[exam.id] ? (
                                  <>
                                    <EyeOff className="h-3 w-3" />
                                    Ocultar
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3" />
                                    Ver Original
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4 px-4 pb-6 border-t border-slate-50">
                          {exam.fileUrl && expandedDocuments[exam.id] && (
                            <div className="rounded-xl border border-blue-200 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
                              <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
                                <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Documento Original
                                </span>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={exam.fileUrl}
                                    download
                                    className="p-1.5 rounded-lg bg-white border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
                                    title="Baixar documento"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                  <button
                                    onClick={() => setFullscreenDocument({ url: exam.fileUrl!, title: exam.type })}
                                    className="p-1.5 rounded-lg bg-white border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
                                    title="Abrir em tela cheia"
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => toggleDocumentExpand(exam.id)}
                                    className="p-1.5 rounded-lg bg-white border border-blue-200 text-slate-600 hover:bg-slate-100 transition-colors"
                                    title="Fechar visualização"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="p-4">
                                {isImageUrl(exam.fileUrl) ? (
                                  <img
                                    src={exam.fileUrl}
                                    alt={`Documento: ${exam.type}`}
                                    className="max-w-full h-auto max-h-[600px] mx-auto rounded-lg shadow-md"
                                  />
                                ) : isPdfUrl(exam.fileUrl) ? (
                                  <iframe
                                    src={exam.fileUrl}
                                    className="w-full h-[600px] rounded-lg border border-slate-200"
                                    title={`Documento: ${exam.type}`}
                                  />
                                ) : (
                                  <iframe
                                    src={exam.fileUrl}
                                    className="w-full h-[600px] rounded-lg border border-slate-200"
                                    title={`Documento: ${exam.type}`}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          {exam.results && exam.results.length > 0 && (
                            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
                              <h4 className="font-bold text-sm mb-4 text-slate-900 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Resultados Laboratoriais
                              </h4>
                              <div className="space-y-3">
                                {exam.results.map((result, idx) => {
                                  const isAbnormal = result.value.includes('*') ||
                                    result.value.toLowerCase().includes('alto') ||
                                    result.value.toLowerCase().includes('baixo');

                                  const trend = isAbnormal ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable';

                                  return (
                                    <div key={idx} className={`grid grid-cols-4 gap-4 p-3 rounded-lg border transition-colors ${isAbnormal ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-white border-slate-100'}`}>
                                      <div className="col-span-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Parâmetro</p>
                                        <p className={`text-sm font-bold ${isAbnormal ? 'text-rose-900' : 'text-slate-800'}`}>{result.name}</p>
                                      </div>
                                      <div className="col-span-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Valor</p>
                                        <div className="flex items-center gap-1.5">
                                          <p className={`text-sm font-extrabold ${isAbnormal ? 'text-rose-600 text-base' : 'text-blue-600'}`}>{result.value}</p>
                                          {isAbnormal && <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />}
                                        </div>
                                      </div>
                                      <div className="col-span-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tendência</p>
                                        <div className="flex items-center gap-2">
                                          <div className={`p-1 rounded-full ${trend === 'up' ? 'bg-rose-100' : trend === 'down' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                            {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-rose-600" />}
                                            {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-emerald-600" />}
                                            {trend === 'stable' && <Minus className="h-3 w-3 text-slate-500" />}
                                          </div>
                                          <span className="text-[11px] font-bold text-slate-600">{trend === 'up' ? 'Aumento' : trend === 'down' ? 'Queda' : 'Estável'}</span>
                                        </div>
                                      </div>
                                      <div className="col-span-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Referência</p>
                                        <p className="text-sm font-semibold text-slate-500">{result.reference}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <AIAnalysisCollapsible exam={exam} />

                          <div className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                            <h3 className="font-extrabold text-xl mb-4 text-slate-900 tracking-tight">Parecer Médico Final</h3>

                            <Button
                              onClick={() => handleGenerateDiagnosis(exam.id)}
                              disabled={state?.isGenerating}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-200 transition-all mb-5 w-full text-base font-bold text-white border-none h-12"
                            >
                              {state?.isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                              {state?.isGenerating ? "Consultando Equipe Médica Digital..." : "Gerar Parecer Multi-Especialista (IA)"}
                            </Button>

                            {state?.generatedDiagnosis && (
                              <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white rounded-xl mb-6 border border-blue-100 shadow-sm">
                                <h4 className="font-extrabold text-lg mb-5 text-blue-900 flex items-center gap-3">
                                  <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                                    <Sparkles className="h-5 w-5 text-white" />
                                  </div>
                                  Insights por Especialidade
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {state.generatedDiagnosis.structuredFindings.map(finding => (
                                    <div key={finding.specialist} className="border border-blue-50 pl-4 py-4 bg-white rounded-xl shadow-sm transition-all hover:shadow-md hover:border-blue-200">
                                      <h5 className="font-bold text-blue-700 mb-2 truncate text-sm uppercase tracking-wider">{finding.specialist}</h5>
                                      <div className="prose prose-slate prose-sm max-w-none
                                                                  prose-p:text-slate-600 prose-p:leading-relaxed prose-p:my-1
                                                                  prose-strong:text-slate-900 prose-strong:font-bold
                                                                  prose-ul:my-1 prose-ul:pl-4 prose-li:text-slate-600
                                                                  prose-code:text-blue-700 prose-code:bg-blue-50">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {finding.findings}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 mb-3 items-center">
                              <DiagnosisMacros onInsert={(text) => {
                                const currentNotes = state?.notes || "";
                                const newNotes = currentNotes ? `${currentNotes}\n${text}` : text;
                                handleNotesChange(exam.id, newNotes);
                              }} />
                              <PrescriptionHelper onAdd={(text) => {
                                const currentNotes = state?.notes || "";
                                const newNotes = currentNotes ? `${currentNotes}\n${text}` : text;
                                handleNotesChange(exam.id, newNotes);
                              }} />
                            </div>

                            <Textarea
                              placeholder="Edite o diagnóstico e adicione sua prescrição oficial aqui..."
                              rows={8}
                              value={state?.notes || ''}
                              onChange={(e) => handleNotesChange(exam.id, e.target.value)}
                              className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-blue-500 focus:border-blue-500 rounded-xl p-4 text-base leading-relaxed"
                            />

                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                              <Button
                                onClick={() => handleSaveDraft(exam.id)}
                                disabled={state?.isSaving || !state?.notes}
                                variant="outline"
                                className="flex-1 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-bold h-11 shadow-sm"
                              >
                                {state?.isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {state?.isSaving ? "Salvando..." : "Salvar Rascunho"}
                              </Button>
                              <Button
                                onClick={() => handleValidateDiagnosis(exam.id)}
                                disabled={state?.isValidating || !state?.notes}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-11 shadow-md shadow-emerald-100"
                              >
                                {state?.isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                {state?.isValidating ? "Validando..." : "Validar e Finalizar"}
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <CheckCircle className="h-12 w-12 text-emerald-100 mb-3" />
                  <p className="font-medium text-slate-500">Nenhum exame pendente de validação.</p>
                </div>
              )}
            </CardContent>
          </Card>


          <Card className="bg-white border-slate-200 shadow-sm border-none ring-1 ring-slate-200">
            <CardHeader className="p-6">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="font-bold">Exames Validados ({validatedExams.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {validatedExams.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {validatedExams.map(exam => (
                    <AccordionItem value={exam.id} key={exam.id} className="border border-slate-100 rounded-xl px-1 bg-white">
                      <AccordionTrigger className="text-sm font-bold hover:no-underline text-slate-800 hover:text-blue-600 px-4 py-3">
                        <div className="flex items-center gap-4 w-full">
                          <Files className="h-5 w-5 text-emerald-500" />
                          <div className="text-left flex-grow">
                            <p className="font-bold">{exam.type}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(exam.date).toLocaleDateString('pt-BR')}</p>
                          </div>
                          {exam.fileUrl && (
                            <button
                              className={`ml-auto text-xs font-bold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full border ${
                                expandedDocuments[exam.id]
                                  ? 'text-white bg-emerald-600 border-emerald-600 hover:bg-emerald-700'
                                  : 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDocumentExpand(exam.id);
                              }}
                            >
                              {expandedDocuments[exam.id] ? (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3" />
                                  Ver Original
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4 px-4 pb-4 border-t border-slate-50 bg-slate-50/30">
                        {exam.fileUrl && expandedDocuments[exam.id] && (
                          <div className="rounded-xl border border-emerald-200 overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white">
                            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                              <span className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Documento Original
                              </span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={exam.fileUrl}
                                  download
                                  className="p-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                  title="Baixar documento"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                                <button
                                  onClick={() => setFullscreenDocument({ url: exam.fileUrl!, title: exam.type })}
                                  className="p-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                  title="Abrir em tela cheia"
                                >
                                  <Maximize2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => toggleDocumentExpand(exam.id)}
                                  className="p-1.5 rounded-lg bg-white border border-emerald-200 text-slate-600 hover:bg-slate-100 transition-colors"
                                  title="Fechar visualização"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="p-4">
                              {isImageUrl(exam.fileUrl) ? (
                                <img
                                  src={exam.fileUrl}
                                  alt={`Documento: ${exam.type}`}
                                  className="max-w-full h-auto max-h-[500px] mx-auto rounded-lg shadow-md"
                                />
                              ) : isPdfUrl(exam.fileUrl) ? (
                                <iframe
                                  src={exam.fileUrl}
                                  className="w-full h-[500px] rounded-lg border border-slate-200"
                                  title={`Documento: ${exam.type}`}
                                />
                              ) : (
                                <iframe
                                  src={exam.fileUrl}
                                  className="w-full h-[500px] rounded-lg border border-slate-200"
                                  title={`Documento: ${exam.type}`}
                                />
                              )}
                            </div>
                          </div>
                        )}
                        {exam.results && exam.results.length > 0 && (
                          <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider mb-3 text-emerald-700 flex items-center gap-2">
                              <FileText className="h-3 w-3" />
                              Valores de Referência
                            </h4>
                            <div className="space-y-2">
                              {exam.results.map((result, idx) => (
                                <div key={idx} className="grid grid-cols-3 gap-4 p-2.5 bg-slate-50/50 rounded-lg border border-slate-100">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Parâmetro</p>
                                    <p className="text-xs font-bold text-slate-700">{result.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Resultado</p>
                                    <p className="text-xs font-extrabold text-emerald-600">{result.value}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Ref.</p>
                                    <p className="text-xs font-semibold text-slate-500">{result.reference}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <h4 className="font-bold text-[10px] uppercase tracking-wider mb-2 text-blue-600">Parecer Médico Validado</h4>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{exam.doctorNotes}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <p className="text-sm font-medium">Nenhum exame validado ainda.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 p-1 rounded-xl h-11 border border-slate-200">
              <TabsTrigger value="summary" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Resumo Clínico</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Linha do Tempo</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card className="bg-white border-slate-200 shadow-sm mt-3 overflow-hidden border-none ring-1 ring-slate-200">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-900">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Perfil do Paciente
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">
                    Síntese gerada por IA a partir do histórico clínico.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-h-[350px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="prose prose-slate prose-sm max-w-none
                                prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                                prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:my-2
                                prose-strong:text-slate-900 prose-strong:font-bold
                                prose-ul:my-2 prose-ul:pl-4 prose-li:text-slate-600 prose-li:my-1
                                prose-ol:my-2 prose-ol:pl-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {summary || "Nenhum resumo disponível."}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <Separator className="my-5 bg-slate-100" />
                  <h4 className="font-bold mb-3 text-[10px] uppercase tracking-wider text-slate-400">Dados do Prontuário</h4>
                  <div className="max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                    <pre className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 overflow-x-auto leading-relaxed border border-slate-100 shadow-inner italic">
                      <code>{patient.examResults || "Nenhum dado bruto registrado."}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-3 h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              <PatientTimeline
                exams={exams}
                consultations={consultations}
                prescriptions={prescriptions}
                patient={patient}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={!!fullscreenDocument} onOpenChange={() => setFullscreenDocument(null)}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-3 text-lg font-bold text-slate-900">
                <FileText className="h-5 w-5 text-blue-600" />
                {fullscreenDocument?.title || 'Documento'}
              </span>
              <div className="flex items-center gap-2">
                {fullscreenDocument?.url && (
                  <a
                    href={fullscreenDocument.url}
                    download
                    className="p-2 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Baixar documento"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                )}
                <a
                  href={fullscreenDocument?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(90vh-80px)] p-4 bg-slate-100">
            {fullscreenDocument?.url && (
              isImageUrl(fullscreenDocument.url) ? (
                <img
                  src={fullscreenDocument.url}
                  alt={`Documento: ${fullscreenDocument.title}`}
                  className="max-w-full h-full object-contain mx-auto rounded-lg shadow-lg"
                />
              ) : (
                <iframe
                  src={fullscreenDocument.url}
                  className="w-full h-full rounded-lg border border-slate-200 bg-white"
                  title={`Documento: ${fullscreenDocument.title}`}
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}