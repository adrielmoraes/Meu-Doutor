
"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { analyzeMedicalExam } from "@/ai/flows/analyze-medical-exam";
import { saveExamAnalysisAction } from "./actions";
import { useRouter } from "next/navigation";

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';

const ExamUploadCard = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();


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
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      try {
        const analysisResult = await analyzeMedicalExam({ examDataUri: dataUri });
        
        // Save the result to Firestore and get the new exam's ID
        const saveResult = await saveExamAnalysisAction(MOCK_PATIENT_ID, {
            ...analysisResult,
            fileName: file.name
        });

        if (!saveResult.success || !saveResult.examId) {
            throw new Error(saveResult.message || "Failed to save exam and get ID.");
        }

        toast({
            title: "Análise Concluída",
            description: "Seu exame foi analisado. Redirecionando...",
            className: "bg-green-100 border-green-200 text-green-800"
        });
        
        // Redirect to the detail page for the newly created exam
        router.push(`/patient/history/${saveResult.examId}`);
        router.refresh();

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

  return (
    <>
      <Card
        className="cursor-pointer transform transition-transform duration-300 hover:scale-[1.03] hover:shadow-xl"
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
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
    </>
  );
};

export default ExamUploadCard;
