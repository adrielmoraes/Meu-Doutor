"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { saveExamAnalysisAction } from "./actions";
import { analyzeMedicalExam } from "@/ai/flows/analyze-medical-exam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, Camera, X, Loader2, Send, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { SessionPayload } from "@/lib/session";
import { getSessionOnClient } from "@/lib/session";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

type StagedFile = {
  id: string;
  file: File | null;
  dataUri: string;
  name: string;
  type: "file" | "camera";
};

export default function UploadExamClient() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] =useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [limitInfo, setLimitInfo] = useState<any>(null); // State to store limit info

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    getSessionOnClient().then(setSession);
  }, []);

  // Verificar limite ao carregar
  useEffect(() => {
    fetch('/api/check-limit?resource=examAnalysis')
      .then(res => res.json())
      .then(data => setLimitInfo(data))
      .catch(console.error);
  }, []);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ variant: "destructive", title: "Arquivo muito grande", description: `O arquivo ${file.name} excede o limite de 4MB.` });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setStagedFiles(prev => [...prev, { id: crypto.randomUUID(), file, dataUri, name: file.name, type: 'file' }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast({ variant: "destructive", title: "Erro na Câmera", description: "Não foi possível acessar a câmera. Verifique as permissões do navegador." });
    }
  };

  useEffect(() => {
    if (showCamera && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    } else {
        cameraStream?.getTracks().forEach(track => track.stop());
    }
     return () => {
      cameraStream?.getTracks().forEach(track => track.stop());
    };
  }, [showCamera, cameraStream]);

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');
      const fileName = `captura_${new Date().toISOString()}.jpg`;
      setStagedFiles(prev => [...prev, { id: crypto.randomUUID(), file: null, dataUri, name: fileName, type: 'camera' }]);
      setShowCamera(false);
    }
  };

  const removeFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleAnalyze = async () => {
    // Verificar limite antes de prosseguir
    if (limitInfo && !limitInfo.allowed) {
      toast({ variant: 'destructive', title: 'Limite Atingido', description: limitInfo.message || 'Você atingiu o limite de análises para o seu plano.' });
      return;
    }

    if (stagedFiles.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhum arquivo', description: 'Por favor, adicione pelo menos um arquivo ou foto para analisar.' });
        return;
    }
    if (!session?.userId) {
        toast({ variant: 'destructive', title: 'Sessão não encontrada', description: 'Por favor, faça login novamente.' });
        return;
    }
    setIsAnalyzing(true);

    // Mensagem inicial elegante com efeito
    toast({
        title: "🔬 Iniciando Análise Médica",
        description: "Nossa equipe de especialistas em IA está examinando seus documentos com atenção e cuidado...",
        duration: 6000,
        className: "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-400 shadow-xl animate-in slide-in-from-top-5 text-blue-900 font-semibold",
    });

    // Mensagem de progresso após 6 segundos
    setTimeout(() => {
        if (isAnalyzing) {
            toast({
                title: "🧠 Análise em Andamento",
                description: "Estamos processando seus exames com tecnologia de ponta. Isso pode levar alguns instantes...",
                duration: 8000,
                className: "bg-gradient-to-r from-purple-100 to-pink-100 border-purple-400 shadow-xl animate-in slide-in-from-right-5 text-purple-900 font-semibold",
            });
        }
    }, 6000);

    try {
        // Primeiro, fazer upload dos arquivos para Vercel Blob
        const uploadFormData = new FormData();
        for (const staged of stagedFiles) {
          if (staged.file) {
            uploadFormData.append('files', staged.file);
          }
        }

        // Importar dinamicamente a Server Action para upload
        const { uploadExamFilesAction } = await import('@/app/patient/upload-exam/actions');
        const uploadResult = await uploadExamFilesAction(uploadFormData);

        if (!uploadResult.success || !uploadResult.urls) {
          toast({
            title: "Erro no Upload",
            description: uploadResult.message || "Ocorreu um erro desconhecido ao fazer upload dos arquivos.",
            variant: "destructive",
          });
          setIsAnalyzing(false);
          return;
        }

        // Agora usar as URLs para análise
        const examUrls = uploadResult.urls;

        const documentsToAnalyze = stagedFiles.map((sf, index) => ({
            examDataUri: examUrls[index], // Usar a URL do Blob Storage
            fileName: sf.name,
        }));

        const analysisResult = await analyzeMedicalExam({ documents: documentsToAnalyze });

        const saveResult = await saveExamAnalysisAction(session.userId, {
            ...analysisResult,
            // Usar as URLs do Blob Storage para salvar, não o dataUri original
            fileUrls: examUrls, // Salvar as URLs dos arquivos
            fileName: `${stagedFiles.length} documento(s) analisado(s)`,
        });

        if (!saveResult.success || !saveResult.examId) {
            throw new Error(saveResult.message || "Failed to save exam and get ID.");
        }

        // Mensagem de sucesso elegante
        toast({
            title: "✨ Análise Concluída!",
            description: "Seus exames foram analisados com sucesso! Preparando seus resultados detalhados...",
            duration: 3500,
            className: "bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 shadow-xl animate-in zoom-in-95 text-green-900 font-semibold",
        });

        // Aguardar 3 segundos antes de redirecionar
        setTimeout(() => {
            router.push(`/patient/history/${saveResult.examId}`);
            router.refresh();
        }, 3000);

    } catch (error) {
        console.error("Analysis failed:", error);
        toast({
          variant: "destructive",
          title: "⚠️ Erro na Análise",
          description: "Não foi possível concluir a análise. Por favor, tente novamente em alguns instantes.",
          duration: 5000,
          className: "bg-red-100 border-red-400 text-red-900 font-semibold animate-in shake",
        });
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-6 space-y-6">
        {/* Camera Modal */}
        {showCamera && (
            <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
                <video ref={videoRef} autoPlay playsInline className="w-full max-w-3xl aspect-video rounded-lg" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-4 mt-4">
                    <Button onClick={takePicture} size="lg">Capturar Foto</Button>
                    <Button onClick={() => setShowCamera(false)} variant="destructive" size="lg">Cancelar</Button>
                </div>
            </div>
        )}

        {/* Upload Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => fileInputRef.current?.click()} className="flex-1 py-6 text-base sm:py-4" size="lg">
            <FileUp className="mr-2" />
            Adicionar Arquivo (PDF, Imagem)
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" />

          <Button onClick={startCamera} className="flex-1 py-6 text-base sm:py-4" size="lg" variant="secondary">
            <Camera className="mr-2" />
            Usar Câmera
          </Button>
        </div>

        {/* Staged Files List */}
        <div className="space-y-3 min-h-24">
            <h3 className="text-lg font-medium text-muted-foreground">Exames na Fila para Análise:</h3>
            {stagedFiles.length === 0 ? (
                <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
                    Nenhum arquivo adicionado.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stagedFiles.map(sf => (
                    <Card key={sf.id} className="relative group overflow-hidden">

                    {/* Scanning Animation Overlay */}
                    {isAnalyzing && (
                        <>
                            <div className="absolute inset-0 z-[5] pointer-events-none">
                                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80 blur-sm animate-scan"
                                     style={{
                                         boxShadow: '0 0 20px 5px rgba(239, 68, 68, 0.5)',
                                         animation: 'scan 2s ease-in-out infinite'
                                     }}
                                />
                                <div className="absolute w-full h-[2px] bg-red-400 opacity-60 animate-scan"
                                     style={{ animation: 'scan 2s ease-in-out infinite' }}
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 via-transparent to-red-500/10 z-[4] pointer-events-none animate-pulse" />
                        </>
                    )}

                    <div className="absolute top-1 right-1 z-10">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-7 w-7 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <X className="h-4 w-4"/>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Você tem certeza que deseja remover o arquivo "{sf.name}" da fila de análise?
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeFile(sf.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                    </div>
                    {sf.dataUri.startsWith('data:image') ? (
                         <Image src={sf.dataUri} alt={sf.name} width={200} height={200} className="w-full h-32 object-cover" />
                    ) : (
                        <div className="w-full h-32 bg-muted flex items-center justify-center p-2">
                             <p className="text-center text-sm font-mono text-muted-foreground">{sf.name}</p>
                        </div>
                    )}
                    <div className="p-2 text-xs bg-card/80">
                        <p className="font-semibold truncate">{sf.name}</p>
                    </div>
                    </Card>
                ))}
                </div>
            )}
        </div>

        {/* Indicador de Limite */}
        {limitInfo && (
          <Card className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                Limite de Análises - Plano {limitInfo.planId}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-slate-300">
                  {limitInfo.current} de {limitInfo.limit === Infinity ? '∞' : limitInfo.limit} análises usadas
                </span>
                <span className="text-gray-700 dark:text-slate-300">
                  {limitInfo.limit === Infinity ? '100' : Math.round(((limitInfo.limit - limitInfo.current) / limitInfo.limit) * 100)}% disponível
                </span>
              </div>
              <Progress
                value={limitInfo.limit === Infinity ? 0 : (limitInfo.current / limitInfo.limit) * 100}
                className="h-2"
              />
              {!limitInfo.allowed && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {limitInfo.message}. Faça upgrade para continuar analisando exames!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || stagedFiles.length === 0 || (limitInfo && !limitInfo.allowed)} // Disable if limit is reached
            size="lg"
            className={`w-full transition-all duration-300 ${isAnalyzing ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse' : ''}`}
        >
            {isAnalyzing ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="font-semibold">Analisando seus exames com IA...</span>
                </>
            ) : (
                <>
                    <Send className="mr-2 h-5 w-5" />
                    <span className="font-semibold">Enviar para Análise Inteligente ({stagedFiles.length})</span>
                </>
            )}
        </Button>

      </CardContent>
    </Card>
  );
}