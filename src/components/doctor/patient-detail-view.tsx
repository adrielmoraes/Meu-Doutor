"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, FileText, User, Pen, CheckCircle, Send, Loader2, FileWarning, Files, Sparkles, Save, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, ChevronDownIcon, Globe, FileSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Patient, Exam } from "@/types";
import { validateExamDiagnosisAction, saveDraftNotesAction, validateMultipleExamsAction } from "@/app/doctor/patients/[id]/actions";
import { releasePatientAction } from "@/app/doctor/actions";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { generateMedicalOpinion } from "@/ai/flows/generate-medical-opinion";
import type { GenerateMedicalOpinionOutput } from "@/ai/flows/generate-medical-opinion";
import { Textarea } from "../ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PatientSafetyBar from "./patient-safety-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PatientTimeline from "./patient-timeline";
import DiagnosisMacros from "./diagnosis-macros";
import PrescriptionHelper from "./prescription-helper";
import { Filter, ExternalLink, CheckSquare, Stethoscope, FileSignature, Eye, EyeOff, Maximize2, Minimize2, X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import SoapEvolutionModal from "./soap-evolution-modal";
import PrescriptionModal from "./prescription-modal";
import MediAILogo from "../layout/mediai-logo";
import { cn } from "@/lib/utils";
import type { Consultation, Prescription } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type PatientDetailViewProps = {
  patient: Patient;
  summary: string;
  exams: Exam[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  doctor: { id: string; name: string; crm: string; specialty: string };
};

// Componente de Markdown médico com destaque visual para alertas
function MedicalMarkdown({ content, className }: { content: string; className?: string }) {
  // Pré-processar marcadores [ALERTA] e [CRÍTICO] para HTML decorado
  const processedContent = content
    .replace(/\[CRÍTICO\]/g, '🔴 **CRÍTICO:**')
    .replace(/\[ALERTA\]/g, '🟠 **ALERTA:**')
    .replace(/\[NORMAL\]/g, '🟢 **NORMAL:**');

  return (
    <div className={`prose prose-slate prose-sm max-w-none text-xs
      prose-p:text-slate-600 dark:text-slate-300 dark:text-slate-600 prose-p:leading-snug prose-p:my-1
      prose-strong:text-slate-900 dark:text-slate-50 prose-strong:font-bold
      prose-ul:my-1 prose-ul:pl-4 prose-li:text-slate-600 dark:text-slate-300 dark:text-slate-600 prose-li:my-0.5
      prose-ol:my-1 prose-ol:pl-4
      prose-h3:text-sm prose-h3:font-extrabold prose-h3:text-slate-900 dark:text-slate-50 prose-h3:mt-3 prose-h3:mb-1.5
      prose-h4:text-xs prose-h4:font-bold prose-h4:text-slate-700 dark:text-slate-200 prose-h4:mt-2 prose-h4:mb-1
      prose-code:text-blue-700 prose-code:bg-blue-50 dark:bg-blue-950/30 prose-code:px-1 prose-code:rounded
      prose-hr:my-2 prose-hr:border-slate-200 dark:border-slate-700
      [&_li]:marker:text-slate-400 dark:text-slate-500
      ${className || ''}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Destaca linhas que contêm marcadores de criticidade
          li: ({ children, ...props }) => {
            const text = String(children);
            const isCritical = text.includes('🔴') || text.includes('CRÍTICO');
            const isAlert = text.includes('🟠') || text.includes('ALERTA');
            const isNormal = text.includes('🟢') || text.includes('NORMAL');

            let borderColor = 'border-l-slate-200';
            let bgColor = 'bg-white dark:bg-slate-900';
            if (isCritical) { borderColor = 'border-l-red-500'; bgColor = 'bg-red-50 dark:bg-red-950/30/50'; }
            else if (isAlert) { borderColor = 'border-l-amber-500'; bgColor = 'bg-amber-50 dark:bg-amber-950/30/50'; }
            else if (isNormal) { borderColor = 'border-l-emerald-400'; bgColor = 'bg-emerald-50 dark:bg-emerald-950/30/30'; }

            return (
              <li
                {...props}
                className={`pl-2 py-0.5 rounded-r border-l-2 ${borderColor} ${bgColor} list-none my-1`}
                style={{ listStyle: 'none' }}
              >
                {children}
              </li>
            );
          },
          strong: ({ children, ...props }) => {
            const text = String(children);
            const isCritical = text.includes('CRÍTICO');
            const isAlert = text.includes('ALERTA');

            let color = 'text-slate-900 dark:text-slate-50';
            if (isCritical) color = 'text-red-700 font-extrabold';
            else if (isAlert) color = 'text-amber-700 font-extrabold';

            return <strong {...props} className={color}>{children}</strong>;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

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
            <h4 className="font-bold text-lg text-slate-900 dark:text-slate-50 tracking-tight">Análise Preliminar da IA</h4>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-5 bg-white dark:bg-slate-900 border-t border-blue-50">
          <div className="max-h-[500px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
            <MedicalMarkdown
              content={exam.preliminaryDiagnosis || "Nenhuma análise disponível."}
              className="prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed"
            />
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

const getExamResultSeverity = (value: string, reference?: string) => {
  const val = value.toLowerCase();

  // 1. Explicit text markers for abnormality (fallback/override)
  const isRedText = val.includes('**') || val.includes('crítico');
  const isAmberText = val.includes('*') || val.includes('alto') || val.includes('baixo') || val.includes('reagente') || val.includes('positivo');
  const isNormalText = val.includes('normal') || val.includes('não reagente') || val.includes('negativo') || val.includes('ausente');

  let isAbnormal = isRedText || isAmberText;
  let isRed = isRedText;

  // 2. Numerical parsing and comparison against reference range
  if (!isAbnormal && !isNormalText && reference) {
    // Extract the main number from the result value (e.g., "45,20 mg/dL" -> 45.20)
    const valMatch = value.match(/(-?\d+(?:[.,]\d+)?)/);

    if (valMatch) {
      const numValue = parseFloat(valMatch[0].replace(',', '.'));

      // Try to extract min and max from the reference string
      // Common formats: "70 a 99", "10 - 20", "Até 200", "> 50", "< 150", "De 0,60 a 1,20"
      const refStr = reference.toLowerCase().replace(/,/g, '.');
      const numbers = [...refStr.matchAll(/(-?\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[0]));

      if (numbers.length >= 2 && refStr.match(/(a|até|-|e|to)/)) {
        // Range: min to max
        const min = Math.min(numbers[0], numbers[1]);
        const max = Math.max(numbers[0], numbers[1]);

        if (numValue < min || numValue > max) {
          isAbnormal = true;
          // Determine if it's way out of bounds (arbitrary >20% deviation for red)
          const range = max - min;
          if (numValue > max + (range * 0.2) || numValue < min - (range * 0.2)) {
            isRed = true;
          }
        }
      } else if (numbers.length === 1) {
        // Single threshold: "< 200", "> 50", "Até 100", "Inferior a 5"
        const refNum = numbers[0];
        const isLessThanTarget = refStr.includes('<') || refStr.includes('até') || refStr.includes('inferior') || refStr.includes('menor');
        const isGreaterThanTarget = refStr.includes('>') || refStr.includes('acima') || refStr.includes('superior') || refStr.includes('maior');

        if (isLessThanTarget && numValue > refNum) {
          isAbnormal = true;
          if (numValue > refNum * 1.2) isRed = true; // >20% above max limit
        } else if (isGreaterThanTarget && numValue < refNum) {
          isAbnormal = true;
          if (numValue < refNum * 0.8) isRed = true; // >20% below min limit
        }
      }
    }
  }

  if (!isAbnormal) return null;

  if (isRed) {
    return {
      container: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 border-l-4 border-l-rose-500',
      indicator: 'bg-rose-500',
      nameText: 'text-rose-900',
      valueText: 'text-rose-600',
      icon: 'text-rose-500',
      trendBg: 'bg-rose-100',
      trendIcon: 'text-rose-600'
    };
  } else {
    return {
      container: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 border-l-4 border-l-amber-500',
      indicator: 'bg-amber-500',
      nameText: 'text-amber-900',
      valueText: 'text-amber-600',
      icon: 'text-amber-500',
      trendBg: 'bg-amber-100',
      trendIcon: 'text-amber-600'
    };
  }
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
  const router = useRouter();

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
  const [fullscreenDocument, setFullscreenDocument] = useState<{ url: string, title?: string } | null>(null);
  const [isParecerFullscreen, setIsParecerFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fullscreenEditor, setFullscreenEditor] = useState<{ examId: string, title: string } | null>(null);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));

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

  const handleGenerateDiagnosis = async (examId: string, scope: 'specific' | 'global' = 'specific') => {
    // Prevent multiple requests for the same exam
    if (validationState[examId]?.isGenerating) {
      return;
    }

    setValidationState(prev => ({ ...prev, [examId]: { ...prev[examId], isGenerating: true, generatedDiagnosis: null } }));
    try {
      const examToAnalyze = exams.find(e => e.id === examId);
      if (!examToAnalyze) throw new Error("Exam not found");

      let examResults = examToAnalyze.preliminaryDiagnosis + "\n\n" + examToAnalyze.explanation;
      let allFindings = examToAnalyze.specialistFindings || [];
      let enrichedHistory = summary || '';

      if (scope === 'specific') {
        // CRUZAMENTO DE DADOS: incluir resumo dos outros exames para correlação
        const otherExams = exams.filter(e => e.id !== examId && (e.preliminaryDiagnosis || e.explanation));
        if (otherExams.length > 0) {
          const otherExamsSummary = otherExams.map(e => {
            let desc = `- ${e.type} (${e.status}): ${e.preliminaryDiagnosis || 'Sem diagnóstico'}`;
            if (e.status === 'Validado' && e.doctorNotes) {
              desc += `\n  PARECER MÉDICO VALIDADO: ${e.doctorNotes}`;
            }
            return desc;
          }).join('\n');
          enrichedHistory += `\n\nOUTROS EXAMES DO PACIENTE (para correlação clínica):\n${otherExamsSummary}`;
        }
      } else {
        // Global: consolida dados de TODOS os exames com notas médicas
        const allExamResults = exams
          .filter(e => e.preliminaryDiagnosis || e.explanation)
          .map(e => {
            let desc = `--- ${e.type} (${e.status}) ---\n${e.preliminaryDiagnosis || ''}\n${e.explanation || ''}`;
            if (e.status === 'Validado' && e.doctorNotes) {
              desc += `\n\n[PARECER MÉDICO VALIDADO]:\n${e.doctorNotes}`;
            }
            return desc;
          })
          .join('\n\n');
        examResults = allExamResults || examResults;

        allFindings = exams
          .flatMap(e => (e.specialistFindings || []) as any[])
          .filter(Boolean);
      }

      // Build IMC info string
      let patientIMC: string | undefined;
      if (patient.weight && patient.height) {
        const w = parseFloat(patient.weight.replace(',', '.'));
        const h = parseFloat(patient.height.replace(',', '.'));
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          const imc = w / ((h / 100) ** 2);
          const imcLabel = imc < 18.5 ? 'Abaixo do Peso' : imc < 25 ? 'Peso Normal' : imc < 30 ? 'Sobrepeso' : imc < 35 ? 'Obesidade Grau I' : imc < 40 ? 'Obesidade Grau II' : 'Obesidade Grau III (Mórbida)';
          patientIMC = `Peso: ${patient.weight}kg | Altura: ${patient.height}cm | IMC: ${imc.toFixed(1)} (${imcLabel})`;
        }
      }

      const result = await generateMedicalOpinion({
        patientId: patient.id,
        patientName: patient.name,
        patientAge: patient.age,
        patientGender: patient.gender,
        patientIMC,
        patientSymptoms: patient.reportedSymptoms || undefined,
        doctorName: doctor.name,
        doctorCrm: doctor.crm,
        doctorSpecialty: doctor.specialty,
        patientHistory: enrichedHistory,
        examType: examToAnalyze.type,
        examResults,
        analysisScope: scope,
        specialistFindings: allFindings,
      });

      setValidationState(prev => ({
        ...prev,
        [examId]: {
          ...prev[examId],
          generatedDiagnosis: result,
          notes: `${result.synthesis}\n\n========================================\nSUGESTÕES DE CONDUETA E TRATAMENTO\n========================================\n\n${result.suggestions}`
        }
      }));

    } catch (error) {
      console.error("Failed to generate diagnosis:", error);
      toast({
        title: "Erro ao Gerar Diagnóstico",
        description: "Não foi possível gerar o parecer médico.",
        variant: "destructive",
      });
    } finally {
      setValidationState(prev => ({ ...prev, [examId]: { ...prev[examId], isGenerating: false } }));
    }
  };

  // Parecer Médico é gerado SOMENTE pelo clique no botão "Gerar Parecer (IA)"
  // Não há mais pre-fetch automático nem geração ao expandir accordion.


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
      className: result.success ? "bg-green-100 text-green-800 border-green-200 dark:border-green-800" : "",
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
    <div className="space-y-6 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden border-none ring-1 ring-slate-200 dark:ring-slate-700">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 border-b border-slate-50">
          <Avatar className="h-24 w-24 border-4 border-white shadow-md shrink-0">
            <AvatarImage src={patient.avatar} data-ai-hint={patient.avatarHint} />
            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-600 text-xl font-bold">{patient.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow min-w-0">
            <CardTitle className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight break-words">{patient.name}</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-lg mt-1 font-medium break-words">
              {patient.age} anos • {patient.gender} • Última Interação: {patient.lastVisit}
            </CardDescription>
            {/* Dados Antropométricos - Peso, Altura, IMC */}
            {(patient.weight || patient.height) && (() => {
              const w = parseFloat((patient.weight || '').replace(',', '.'));
              const h = parseFloat((patient.height || '').replace(',', '.'));
              const hasIMC = !isNaN(w) && !isNaN(h) && w > 0 && h > 0;
              const imc = hasIMC ? w / ((h / 100) ** 2) : 0;
              const imcLabel = imc < 18.5 ? 'Abaixo do Peso' : imc < 25 ? 'Peso Normal' : imc < 30 ? 'Sobrepeso' : imc < 35 ? 'Obesidade I' : imc < 40 ? 'Obesidade II' : 'Obesidade III';
              const imcColor = imc < 18.5 ? 'text-amber-600 bg-amber-50 border-amber-200' : imc < 25 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : imc < 30 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200';
              return (
                <div className="flex flex-wrap gap-2 mt-2">
                  {patient.weight && (
                    <Badge variant="outline" className="text-xs font-semibold border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50">
                      Peso: {patient.weight} kg
                    </Badge>
                  )}
                  {patient.height && (
                    <Badge variant="outline" className="text-xs font-semibold border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50">
                      Altura: {patient.height} cm
                    </Badge>
                  )}
                  {hasIMC && (
                    <Badge variant="outline" className={`text-xs font-bold border ${imcColor}`}>
                      IMC: {imc.toFixed(1)} — {imcLabel}
                    </Badge>
                  )}
                </div>
              );
            })()}
            {/* Alerta de Queixas Recentes */}
            {patient.reportedSymptoms && patient.reportedSymptoms.trim() && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                <p className="text-xs font-bold uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Queixas Relatadas pelo Paciente
                </p>
                <p className="text-sm leading-relaxed">{patient.reportedSymptoms}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
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
                <Badge variant="outline" className="text-[10px] font-bold px-3 py-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 dark:text-slate-600 bg-white dark:bg-slate-900">
                  Prioridade: <span className="ml-1 text-slate-900 dark:text-slate-50">{patient.priority}</span>
                </Badge>
              )}
              {patient.attendingDoctorId === doctor.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const result = await releasePatientAction(patient.id);
                    if (result.success) {
                      toast({
                        title: "Paciente liberado",
                        description: "O paciente retornou ao Mural de Casos.",
                        variant: "default",
                      });
                      router.push('/doctor/patients');
                    } else {
                      toast({
                        title: "Erro",
                        description: result.message,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="mt-2 text-rose-600 hover:bg-rose-50 dark:bg-rose-950/30 hover:text-rose-700 border-rose-200 w-full font-bold shadow-sm"
                >
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                  Devolver ao Mural
                </Button>
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
              className={`rounded-full h-9 px-5 text-xs font-bold shadow-sm transition-all ${selectedCategory === null ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950'}`}
            >
              Todos
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full h-9 px-5 text-xs font-bold shadow-sm transition-all ${selectedCategory === cat ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950'}`}
              >
                {cat}
              </Button>
            ))}
          </div>


          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm border-none ring-1 ring-slate-200 dark:ring-slate-700">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50 justify-between w-full">
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
              <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">Revise a análise da IA e forneça seu diagnóstico final para cada exame.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {pendingExams.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={pendingExams[0].id}>
                  {pendingExams.map(exam => {
                    const state = validationState[exam.id];
                    return (
                      <AccordionItem value={exam.id} key={exam.id} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm px-1 bg-white dark:bg-slate-900">
                        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 transition-all hover:bg-slate-50 dark:bg-slate-950">
                          <div className="flex items-center gap-4 flex-1">
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center shrink-0">
                              <Checkbox
                                checked={selectedExams.includes(exam.id)}
                                onCheckedChange={() => toggleExamSelection(exam.id)}
                                className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-5 w-5"
                              />
                            </div>

                            {/* O AccordionTrigger agora envolve APENAS o título/ícone para expandir, não os botões extras */}
                            <AccordionTrigger className="flex-1 py-1 hover:no-underline text-base font-bold text-slate-900 dark:text-slate-50 hover:text-blue-600 transition-all text-left">
                              <div className="flex items-center gap-4 w-full">
                                <Files className="h-5 w-5 text-blue-500 shrink-0" />
                                <span className="tracking-tight">{exam.type}</span>
                              </div>
                            </AccordionTrigger>
                          </div>

                          {/* Botões de ação fora do trigger */}
                          {exam.fileUrl && (
                            <div className="shrink-0 ml-4 hidden sm:block">
                              <span
                                role="button"
                                tabIndex={0}
                                className={`text-xs font-bold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full border cursor-pointer select-none ${expandedDocuments[exam.id]
                                  ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700'
                                  : 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-100 hover:bg-blue-100'
                                  }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleDocumentExpand(exam.id);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleDocumentExpand(exam.id);
                                  }
                                }}
                              >
                                {expandedDocuments[exam.id] ? (
                                  <>
                                    <EyeOff className="h-3 w-3" />
                                    Ocultar Original
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3" />
                                    Ver Original
                                  </>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        <AccordionContent className="space-y-6 pt-4 px-4 pb-6 border-t border-slate-50">
                          <div className="flex flex-col gap-6">
                            {/* Esquerda: Documento e Resultados (quando expandido) */}
                            {expandedDocuments[exam.id] && (
                              <div className="space-y-6">
                                {exam.fileUrl && (
                                  <div className="rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white flex flex-col h-full">
                                    <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 shrink-0">
                                      <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Documento Original
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <a
                                          href={exam.fileUrl}
                                          download
                                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-600 hover:bg-blue-100 transition-colors"
                                          title="Baixar documento"
                                        >
                                          <Download className="h-4 w-4" />
                                        </a>
                                        <button
                                          onClick={() => {
                                            setFullscreenDocument({ url: exam.fileUrl!, title: exam.type });
                                            setZoomLevel(1);
                                          }}
                                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-600 hover:bg-blue-100 transition-colors"
                                          title="Abrir em tela cheia"
                                        >
                                          <Maximize2 className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => toggleDocumentExpand(exam.id)}
                                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:bg-slate-800 transition-colors"
                                          title="Fechar visualização"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="p-4 flex-1 overflow-auto min-h-[400px]">
                                      {isImageUrl(exam.fileUrl) ? (
                                        <div className="flex justify-center items-center w-full bg-slate-50 dark:bg-slate-950/50 rounded-lg p-2">
                                          <img
                                            src={exam.fileUrl}
                                            alt={`Documento: ${exam.type}`}
                                            className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-md"
                                          />
                                        </div>
                                      ) : (
                                        <iframe
                                          src={exam.fileUrl}
                                          className="w-full h-full min-h-[500px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                          title={`Documento: ${exam.type}`}
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}

                                {exam.results && exam.results.length > 0 && (
                                  <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl shadow-inner">
                                    <h4 className="font-bold text-sm mb-4 text-slate-900 dark:text-slate-50 flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                      Resultados Laboratoriais
                                    </h4>
                                    <div className="space-y-3">
                                      {exam.results.map((result, idx) => {
                                        const severity = getExamResultSeverity(result.value);
                                        const isAbnormal = !!severity;
                                        const trend = isAbnormal ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable';

                                        return (
                                          <div key={idx} className={`grid grid-cols-4 gap-4 p-3 rounded-lg border transition-colors ${isAbnormal ? `${severity.container} shadow-sm relative overflow-hidden` : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                            {isAbnormal && <div className={`absolute left-0 top-0 bottom-0 w-1 ${severity.indicator}`}></div>}
                                            <div className="col-span-1">
                                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Parâmetro</p>
                                              <p className={`text-sm font-bold ${isAbnormal ? severity.nameText : 'text-slate-800 dark:text-slate-100'}`}>{result.name}</p>
                                            </div>
                                            <div className="col-span-1">
                                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Valor</p>
                                              <div className="flex items-center gap-1.5">
                                                <p className={`text-sm font-extrabold ${isAbnormal ? `${severity.valueText} text-base` : 'text-blue-600'}`}>{result.value}</p>
                                                {isAbnormal && <AlertTriangle className={`h-4 w-4 ${severity.icon} animate-pulse`} />}
                                              </div>
                                            </div>
                                            <div className="col-span-1">
                                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tendência</p>
                                              <div className="flex items-center gap-2">
                                                <div className={`p-1 rounded-full ${trend === 'up' ? 'bg-rose-100' : trend === 'down' ? 'bg-emerald-100' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                  {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-rose-600" />}
                                                  {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-emerald-600" />}
                                                  {trend === 'stable' && <Minus className="h-3 w-3 text-slate-500 dark:text-slate-400" />}
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 dark:text-slate-600 truncate">{trend === 'up' ? 'Aumento' : trend === 'down' ? 'Queda' : 'Estável'}</span>
                                              </div>
                                            </div>
                                            <div className="col-span-1">
                                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Ref</p>
                                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate" title={result.reference}>{result.reference}</p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Direita (ou Centro): IA e Parecer */}
                            <div className="space-y-6 flex flex-col">
                              {!expandedDocuments[exam.id] && exam.results && exam.results.length > 0 && (
                                <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl shadow-inner">
                                  <h4 className="font-bold text-sm mb-4 text-slate-900 dark:text-slate-50 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    Resultados Laboratoriais
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {exam.results.map((result, idx) => {
                                      const severity = getExamResultSeverity(result.value);
                                      const isAbnormal = !!severity;
                                      return (
                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${isAbnormal ? severity.container : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                          <div className="min-w-0 pr-2">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">{result.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                              <p className={`text-sm font-extrabold ${isAbnormal ? severity.valueText : 'text-slate-800 dark:text-slate-100'}`}>{result.value}</p>
                                              {isAbnormal && <AlertTriangle className={`h-3.5 w-3.5 ${severity.icon}`} />}
                                            </div>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Ref</p>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[80px]" title={result.reference}>{result.reference}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <AIAnalysisCollapsible exam={exam} />

                              <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-50 tracking-tight">Parecer Médico Final</h3>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setFullscreenEditor({ examId: exam.id, title: exam.type });
                                      setIsParecerFullscreen(true);
                                    }}
                                    className="text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-950/30 border-slate-200 dark:border-slate-700 h-9 px-3 font-bold gap-1.5"
                                    title="Expandir editor em tela cheia"
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                    <span className="hidden sm:inline text-xs">Tela Cheia</span>
                                  </Button>
                                </div>

                                {/* Cabeçalho Profissional do Parecer */}
                                <div className="mb-5 p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200 dark:border-slate-700 rounded-xl">
                                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <div className="relative h-10 w-10 shrink-0">
                                      <Image
                                        src="/logo.svg"
                                        alt="MediAI Logo"
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                    <div>
                                      <p className="font-extrabold text-lg text-slate-900 dark:text-slate-50 tracking-tight">Medi.AI</p>
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Parecer Médico Digital</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Médico Responsável</p>
                                      <p className="font-bold text-slate-800 dark:text-slate-100">Dr(a). {doctor.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">CRM</p>
                                      <p className="font-bold text-slate-800 dark:text-slate-100">{doctor.crm || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Especialidade</p>
                                      <p className="font-bold text-slate-800 dark:text-slate-100">{doctor.specialty || 'Clínica Geral'}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data do Parecer</p>
                                      <p className="font-bold text-slate-800 dark:text-slate-100">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                  </div>
                                </div>

                                {state?.isGenerating ? (
                                  <Button disabled className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-md shadow-blue-200 mb-5 w-full text-base font-bold text-white border-none h-12 shrink-0">
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Consultando AI...
                                  </Button>
                                ) : (
                                  <div className="flex gap-2 mb-5 w-full">
                                    <Button
                                      onClick={() => handleGenerateDiagnosis(exam.id, 'specific')}
                                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-200 transition-all flex-1 text-sm font-bold text-white border-none h-12"
                                    >
                                      <FileSearch className="mr-2 h-4 w-4" />
                                      Parecer Deste Exame
                                    </Button>
                                    <Button
                                      onClick={() => handleGenerateDiagnosis(exam.id, 'global')}
                                      variant="outline"
                                      className="border-blue-200 dark:border-blue-800 text-blue-700 hover:bg-blue-50 dark:bg-blue-950/30 hover:text-blue-800 transition-all flex-1 text-sm font-bold h-12"
                                    >
                                      <Globe className="mr-2 h-4 w-4" />
                                      Parecer Global
                                    </Button>
                                  </div>
                                )}




                                <div className="flex flex-wrap gap-2 mb-3 items-center shrink-0">
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
                                  value={state?.notes || ''}
                                  onChange={(e) => handleNotesChange(exam.id, e.target.value)}
                                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:text-slate-500 focus:ring-blue-500 focus:border-blue-500 rounded-xl p-4 text-base leading-relaxed flex-1 min-h-[150px] resize-y"
                                />

                                <div className="flex flex-col sm:flex-row gap-3 mt-6 shrink-0">
                                  <Button
                                    onClick={() => handleSaveDraft(exam.id)}
                                    disabled={state?.isSaving || !state?.notes}
                                    variant="outline"
                                    className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-bold h-11 shadow-sm"
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
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                  <CheckCircle className="h-12 w-12 text-emerald-100 mb-3" />
                  <p className="font-medium text-slate-500 dark:text-slate-400">Nenhum exame pendente de validação.</p>
                </div>
              )}
            </CardContent>
          </Card>


          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm border-none ring-1 ring-slate-200 dark:ring-slate-700">
            <CardHeader className="p-6">
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-50">
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
                    <AccordionItem value={exam.id} key={exam.id} className="border border-slate-100 dark:border-slate-800 rounded-xl px-1 bg-white dark:bg-slate-900">
                      <AccordionTrigger className="text-sm font-bold hover:no-underline text-slate-800 dark:text-slate-100 hover:text-blue-600 px-4 py-3">
                        <div className="flex items-center gap-4 w-full">
                          <Files className="h-5 w-5 text-emerald-500" />
                          <div className="text-left flex-grow">
                            <p className="font-bold">{exam.type}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{new Date(exam.date).toLocaleDateString('pt-BR')}</p>
                          </div>
                          {exam.fileUrl && (
                            <span
                              role="button"
                              tabIndex={0}
                              className={`ml-auto text-xs font-bold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full border cursor-pointer ${expandedDocuments[exam.id]
                                ? 'text-white bg-emerald-600 border-emerald-600 hover:bg-emerald-700'
                                : 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-100 hover:bg-blue-100'
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDocumentExpand(exam.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  toggleDocumentExpand(exam.id);
                                }
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
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4 px-4 pb-4 border-t border-slate-50 bg-slate-50 dark:bg-slate-950/30">
                        {exam.fileUrl && expandedDocuments[exam.id] && (
                          <div className="rounded-xl border border-emerald-200 overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white">
                            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100">
                              <span className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Documento Original
                              </span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={exam.fileUrl}
                                  download
                                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                  title="Baixar documento"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                                <button
                                  onClick={() => setFullscreenDocument({ url: exam.fileUrl!, title: exam.type })}
                                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                  title="Abrir em tela cheia"
                                >
                                  <Maximize2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => toggleDocumentExpand(exam.id)}
                                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 text-slate-600 dark:text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:bg-slate-800 transition-colors"
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
                                  className="w-full h-[500px] rounded-lg border border-slate-200 dark:border-slate-700"
                                  title={`Documento: ${exam.type}`}
                                />
                              ) : (
                                <iframe
                                  src={exam.fileUrl}
                                  className="w-full h-[500px] rounded-lg border border-slate-200 dark:border-slate-700"
                                  title={`Documento: ${exam.type}`}
                                />
                              )}
                            </div>
                          </div>
                        )}
                        {exam.results && exam.results.length > 0 && (
                          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider mb-3 text-emerald-700 flex items-center gap-2">
                              <FileText className="h-3 w-3" />
                              Valores de Referência
                            </h4>
                            <div className="space-y-2">
                              {exam.results.map((result, idx) => (
                                <div key={idx} className="grid grid-cols-3 gap-4 p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Parâmetro</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{result.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Resultado</p>
                                    <p className="text-xs font-extrabold text-emerald-600">{result.value}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Ref.</p>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{result.reference}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                          <h4 className="font-bold text-[10px] uppercase tracking-wider mb-2 text-blue-600">Parecer Médico Validado</h4>
                          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{exam.doctorNotes}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                  <p className="text-sm font-medium">Nenhum exame validado ainda.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl h-11 border border-slate-200 dark:border-slate-700">
              <TabsTrigger value="summary" className="rounded-lg font-bold text-xs data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-sm">Resumo Clínico</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-lg font-bold text-xs data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:shadow-sm">Linha do Tempo</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm mt-3 overflow-hidden border-none ring-1 ring-slate-200 dark:ring-slate-700">
                <CardHeader className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-slate-50">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Perfil do Paciente
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Síntese gerada por IA a partir do histórico clínico.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-h-[350px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="prose prose-slate prose-sm max-w-none
                                prose-headings:text-slate-900 dark:text-slate-50 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                                prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                                prose-p:text-slate-600 dark:text-slate-300 dark:text-slate-600 prose-p:leading-relaxed prose-p:my-2
                                prose-strong:text-slate-900 dark:text-slate-50 prose-strong:font-bold
                                prose-ul:my-2 prose-ul:pl-4 prose-li:text-slate-600 dark:text-slate-300 dark:text-slate-600 prose-li:my-1
                                prose-ol:my-2 prose-ol:pl-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {summary || "Nenhum resumo disponível."}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <Separator className="my-5 bg-slate-100 dark:bg-slate-800" />
                  <h4 className="font-bold mb-3 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Dados do Prontuário</h4>
                  <div className="max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                    <pre className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs text-slate-600 dark:text-slate-300 dark:text-slate-600 overflow-x-auto leading-relaxed border border-slate-100 dark:border-slate-800 shadow-inner italic">
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

      {/* Dialog do Editor em Tela Cheia */}
      <Dialog open={!!fullscreenEditor} onOpenChange={(open) => {
        if (!open) {
          setFullscreenEditor(null);
          setIsParecerFullscreen(false);
        }
      }}>
        <DialogContent className={cn(
          "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 shadow-xl transition-all duration-300 flex flex-col p-0 overflow-hidden",
          isParecerFullscreen
            ? "fixed inset-0 left-0 top-0 translate-x-0 translate-y-0 max-w-none w-screen h-screen m-0 rounded-none z-[9999]"
            : "max-w-[95vw] w-[95vw] h-[90vh]"
        )}>
          <DialogHeader className={isParecerFullscreen ? "sr-only" : "px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white shrink-0"}>
            <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-slate-50">
              <div className="relative h-10 w-10 shrink-0">
                <Image
                  src="/logo.svg"
                  alt="MediAI Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <span>Parecer Médico Final</span>
                {fullscreenEditor && (
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">{fullscreenEditor.title}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {isParecerFullscreen && (
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-2xl z-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                  <MediAILogo size="sm" showText={false} />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight leading-none">PARECER MÉDICO FINAL</h2>
                  <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                    <span className="text-[10px] bg-blue-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">EDIÇÃO IMERSIVA</span>
                    <span className="text-[11px] font-medium text-slate-400 truncate max-w-[200px] border-l border-slate-700 pl-3">Paciente: {patient.name}</span>
                    <span className="text-[11px] font-medium text-slate-400 truncate max-w-[200px] border-l border-slate-700 pl-3">Médico: {doctor.name}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => setIsParecerFullscreen(false)}
                className="text-white hover:bg-white/10 font-bold border border-white/20 rounded-xl px-4 h-10 gap-2 transition-all"
              >
                <Minimize2 className="h-4 w-4" />
                SAIR DA TELA CHEIA
              </Button>
            </div>
          )}
          {fullscreenEditor && (
            <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">


              <div className="flex flex-wrap gap-2 items-center shrink-0">
                <DiagnosisMacros onInsert={(text) => {
                  const currentNotes = validationState[fullscreenEditor.examId]?.notes || "";
                  const newNotes = currentNotes ? `${currentNotes}\n${text}` : text;
                  handleNotesChange(fullscreenEditor.examId, newNotes);
                }} />
                <PrescriptionHelper onAdd={(text) => {
                  const currentNotes = validationState[fullscreenEditor.examId]?.notes || "";
                  const newNotes = currentNotes ? `${currentNotes}\n${text}` : text;
                  handleNotesChange(fullscreenEditor.examId, newNotes);
                }} />
              </div>

              <Textarea
                placeholder="Edite o diagnóstico e adicione sua prescrição oficial aqui..."
                value={validationState[fullscreenEditor.examId]?.notes || ''}
                onChange={(e) => handleNotesChange(fullscreenEditor.examId, e.target.value)}
                className={cn(
                  "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:text-slate-500 focus:ring-blue-500 focus:border-blue-500 rounded-xl flex-1 min-h-0 resize-none transition-all",
                  isParecerFullscreen ? "p-12 text-xl font-serif leading-relaxed shadow-inner" : "p-5 text-base leading-relaxed"
                )}
              />

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button
                  onClick={() => { handleSaveDraft(fullscreenEditor.examId); }}
                  disabled={validationState[fullscreenEditor.examId]?.isSaving || !validationState[fullscreenEditor.examId]?.notes}
                  variant="outline"
                  className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-bold h-12 shadow-sm"
                >
                  {validationState[fullscreenEditor.examId]?.isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {validationState[fullscreenEditor.examId]?.isSaving ? "Salvando..." : "Salvar Rascunho"}
                </Button>
                <Button
                  onClick={() => { handleValidateDiagnosis(fullscreenEditor.examId); setFullscreenEditor(null); }}
                  disabled={validationState[fullscreenEditor.examId]?.isValidating || !validationState[fullscreenEditor.examId]?.notes}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-12 shadow-md shadow-emerald-100"
                >
                  {validationState[fullscreenEditor.examId]?.isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  {validationState[fullscreenEditor.examId]?.isValidating ? "Validando..." : "Validar e Finalizar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!fullscreenDocument} onOpenChange={(open) => {
        if (!open) { setFullscreenDocument(null); setZoomLevel(1); }
      }}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-slate-50 truncate">
                <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                {fullscreenDocument?.title || 'Documento'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {/* Controles de Zoom para imagem */}
                {fullscreenDocument?.url && isImageUrl(fullscreenDocument.url) && (
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mr-2">
                    <button onClick={handleZoomOut} className="p-2 text-slate-600 dark:text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:bg-slate-800 transition-colors border-r border-slate-200 dark:border-slate-700" title="Reduzir zoom">
                      <ZoomOut className="h-5 w-5" />
                    </button>
                    <span className="px-3 text-sm font-bold text-slate-600 dark:text-slate-300 dark:text-slate-600 min-w-[70px] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button onClick={handleZoomIn} className="p-2 text-slate-600 dark:text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:bg-slate-800 transition-colors border-l border-slate-200 dark:border-slate-700" title="Aumentar zoom">
                      <ZoomIn className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {fullscreenDocument?.url && (
                  <a
                    href={fullscreenDocument.url}
                    download
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 hover:bg-blue-50 dark:bg-blue-950/30 transition-colors"
                    title="Baixar documento"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                )}
                <a
                  href={fullscreenDocument?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:bg-slate-800 transition-colors"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-800 relative">
            <div className="min-h-full min-w-full flex items-center justify-center p-4">
              {fullscreenDocument?.url && (
                isImageUrl(fullscreenDocument.url) ? (
                  <img
                    src={fullscreenDocument.url}
                    alt={`Documento: ${fullscreenDocument.title}`}
                    className="rounded-lg shadow-lg pointer-events-auto transition-transform duration-200 ease-in-out"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      maxWidth: zoomLevel <= 1 ? '100%' : 'none',
                      maxHeight: zoomLevel <= 1 ? '100%' : 'none'
                    }}
                  />
                ) : (
                  <iframe
                    src={fullscreenDocument.url}
                    className="w-full h-full min-h-[80vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    title={`Documento: ${fullscreenDocument.title}`}
                  />
                )
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}