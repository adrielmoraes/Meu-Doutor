
"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Loader2, Volume2, PlayCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { analyzeMedicalExam, AnalyzeMedicalExamOutput } from "@/ai/flows/analyze-medical-exam";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { saveExamAnalysisAction } from "./actions";

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

const ExamUploadCard = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeMedicalExamOutput | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = "pt-BR";
    utterance.onend = () => setIsSpeaking(false);
    utteranceRef.current = utterance;

    return () => {
      synth.cancel();
    };
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "Por favor, selecione um arquivo menor que 4MB.",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      try {
        const result = await analyzeMedicalExam({ examDataUri: dataUri });
        setAnalysisResult(result);
        setIsResultOpen(true);

        // Save the result to Firestore
        await saveExamAnalysisAction(MOCK_PATIENT_ID, {
            ...result,
            fileName: file.name
        });

      } catch (error) {
        console.error("Analysis failed:", error);
        toast({
          variant: "destructive",
          title: "Erro na Análise",
          description: "Não foi possível analisar o exame. Tente novamente.",
        });
      } finally {
        setIsAnalyzing(false);
        if(fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
       toast({
          variant: "destructive",
          title: "Erro de Leitura",
          description: "Não foi possível ler o arquivo. Tente novamente.",
        });
        setIsAnalyzing(false);
    }
    reader.readAsDataURL(file);
  };

  const handlePlayAudio = () => {
    if (!analysisResult || !utteranceRef.current) return;
    const synth = window.speechSynthesis;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
    } else {
      const textToSpeak = `Diagnóstico Preliminar: ${analysisResult.preliminaryDiagnosis}. Explicação: ${analysisResult.explanation}`;
      utteranceRef.current.text = textToSpeak;
      synth.speak(utteranceRef.current);
      setIsSpeaking(true);
    }
  };

  return (
    <>
      <Card
        className="cursor-pointer transform transition-transform duration-300 hover:scale-105 hover:shadow-xl"
        onClick={() => fileInputRef.current?.click()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Upload de Exames</CardTitle>
          {isAnalyzing ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-primary" />
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isAnalyzing
              ? "Analisando seu exame, por favor aguarde..."
              : "Clique para carregar e analisar seus exames (PDF, JPG, PNG)."}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={isAnalyzing}
          />
        </CardContent>
      </Card>

      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Resultado da Análise do Exame
            </DialogTitle>
          </DialogHeader>
          {analysisResult && (
            <div className="space-y-4">
              <Alert>
                  <Volume2 className="h-4 w-4" />
                  <AlertTitle>Ouça a Análise</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    Clique no botão para ouvir a explicação da IA.
                    <Button size="icon" variant="ghost" onClick={handlePlayAudio} aria-label="Reproduzir áudio">
                      <PlayCircle className={`h-6 w-6 ${isSpeaking ? 'text-destructive' : 'text-primary'}`} />
                    </Button>
                  </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold text-lg">Diagnóstico Preliminar</h3>
                <p className="text-muted-foreground">{analysisResult.preliminaryDiagnosis}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Explicação</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.explanation}</p>
              </div>

              <div className="pt-4 border-t">
                  <p className="text-xs text-destructive font-semibold">AVISO IMPORTANTE:</p>
                  <p className="text-xs text-muted-foreground">Este é um diagnóstico preliminar gerado por IA. Ele não substitui a avaliação de um médico qualificado. Consulte um profissional de saúde para obter um diagnóstico final e um plano de tratamento.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExamUploadCard;
