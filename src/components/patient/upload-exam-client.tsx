"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { analyzeSingleExamAction, consolidateExamsAction, type SingleExamAnalysisResult } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, Camera, X, Loader2, Send, AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SessionPayload } from "@/lib/session";
import { getSessionOnClient } from "@/lib/session";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type { SingleDocumentOutput } from "@/ai/flows/analyze-single-exam";

type FileStatus = 'pending' | 'analyzing' | 'completed' | 'error';

type StagedFile = {
  id: string;
  file: File | null;
  dataUri: string;
  name: string;
  type: "file" | "camera";
  status: FileStatus;
  examId?: string;
  analysis?: SingleDocumentOutput;
  error?: string;
};

export default function UploadExamClient() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [limitInfo, setLimitInfo] = useState<any>(null);
  const [analysisPhase, setAnalysisPhase] = useState<'idle' | 'individual' | 'consolidating' | 'wellness'>('idle');
  const [previewImage, setPreviewImage] = useState<{dataUri: string; name: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    getSessionOnClient().then(setSession);
  }, []);

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
      if (file.size > 4 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Arquivo muito grande", description: `O arquivo ${file.name} excede o limite de 4MB.` });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setStagedFiles(prev => [...prev, { 
          id: crypto.randomUUID(), 
          file, 
          dataUri, 
          name: file.name, 
          type: 'file',
          status: 'pending'
        }]);
      };
      reader.readAsDataURL(file);
    });

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
      setStagedFiles(prev => [...prev, { 
        id: crypto.randomUUID(), 
        file: null, 
        dataUri, 
        name: fileName, 
        type: 'camera',
        status: 'pending'
      }]);
      setShowCamera(false);
    }
  };

  const removeFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'analyzing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: FileStatus) => {
    switch (status) {
      case 'pending':
        return 'Aguardando';
      case 'analyzing':
        return 'Analisando...';
      case 'completed':
        return 'Concluído';
      case 'error':
        return 'Erro';
    }
  };

  const handleAnalyze = async () => {
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
    setAnalysisPhase('individual');
    
    toast({
      title: "Iniciando Análise Sequencial",
      description: `Analisando ${stagedFiles.length} arquivo(s) um por vez...`,
      duration: 4000,
      className: "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-400 shadow-xl text-blue-900 font-semibold",
    });

    const results: Array<{
      fileName: string;
      examId: string;
      analysis: SingleDocumentOutput;
    }> = [];

    for (let i = 0; i < stagedFiles.length; i++) {
      const file = stagedFiles[i];
      setCurrentFileIndex(i);
      
      setStagedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'analyzing' as FileStatus } : f
      ));

      toast({
        title: `Analisando arquivo ${i + 1} de ${stagedFiles.length}`,
        description: file.name,
        duration: 3000,
        className: "bg-gradient-to-r from-purple-100 to-pink-100 border-purple-400 shadow-xl text-purple-900 font-semibold",
      });

      try {
        const result = await analyzeSingleExamAction(session.userId, {
          examDataUri: file.dataUri,
          fileName: file.name,
        });

        if (result.success && result.examId && result.analysis) {
          setStagedFiles(prev => prev.map((f, idx) => 
            idx === i ? { 
              ...f, 
              status: 'completed' as FileStatus, 
              examId: result.examId,
              analysis: result.analysis 
            } : f
          ));
          
          results.push({
            fileName: file.name,
            examId: result.examId,
            analysis: result.analysis,
          });

          toast({
            title: `Arquivo ${i + 1} analisado`,
            description: `${file.name} processado com sucesso!`,
            duration: 2000,
            className: "bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 shadow-xl text-green-900 font-semibold",
          });
        } else {
          throw new Error(result.error || 'Falha na análise');
        }
      } catch (error: any) {
        console.error(`Error analyzing file ${i}:`, error);
        setStagedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' as FileStatus, error: error.message } : f
        ));
        
        toast({
          variant: "destructive",
          title: `Erro no arquivo ${i + 1}`,
          description: `Não foi possível analisar ${file.name}. Continuando com os demais...`,
          duration: 4000,
        });
      }
    }

    if (results.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum arquivo analisado",
        description: "Não foi possível analisar nenhum dos arquivos enviados.",
        duration: 5000,
      });
      setIsAnalyzing(false);
      setAnalysisPhase('idle');
      return;
    }

    setAnalysisPhase('consolidating');
    toast({
      title: "Consolidando Análises",
      description: "Combinando resultados e gerando diagnóstico com equipe de especialistas...",
      duration: 6000,
      className: "bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-400 shadow-xl text-indigo-900 font-semibold",
    });

    try {
      const consolidationResult = await consolidateExamsAction(session.userId, results);

      if (consolidationResult.success) {
        setAnalysisPhase('wellness');
        
        toast({
          title: "Análise Consolidada!",
          description: "Gerando seu plano de bem-estar personalizado...",
          duration: 4000,
          className: "bg-gradient-to-r from-green-100 to-teal-100 border-green-400 shadow-xl text-green-900 font-semibold",
        });

        setTimeout(() => {
          toast({
            title: "Análise Completa!",
            description: "Todos os exames foram analisados. Redirecionando para os resultados...",
            duration: 3000,
            className: "bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 shadow-xl animate-in zoom-in-95 text-green-900 font-semibold",
          });
          
          setTimeout(() => {
            router.push(`/patient/history/${consolidationResult.primaryExamId}`);
            router.refresh();
          }, 2000);
        }, 2000);
      } else {
        throw new Error(consolidationResult.message);
      }
    } catch (error: any) {
      console.error("Consolidation error:", error);
      toast({
        variant: "destructive",
        title: "Erro na Consolidação",
        description: "Análises individuais salvas, mas houve erro na consolidação.",
        duration: 5000,
      });
      
      if (results.length > 0) {
        setTimeout(() => {
          router.push(`/patient/history/${results[0].examId}`);
          router.refresh();
        }, 3000);
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisPhase('idle');
      setCurrentFileIndex(-1);
    }
  };

  const completedCount = stagedFiles.filter(f => f.status === 'completed').length;
  const overallProgress = stagedFiles.length > 0 
    ? (completedCount / stagedFiles.length) * 100 
    : 0;

  return (
    <Card>
      <CardContent className="p-4 md:p-6 space-y-6">
        {showCamera && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-2 md:p-4">
            <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full max-h-[80vh] object-contain rounded-lg" 
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-4 mt-4 pb-4">
              <Button onClick={takePicture} size="lg" className="px-8 py-6 text-lg">
                <Camera className="mr-2 h-6 w-6" />
                Capturar Foto
              </Button>
              <Button onClick={() => setShowCamera(false)} variant="destructive" size="lg" className="px-8 py-6 text-lg">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex-1 py-6 text-base sm:py-4" 
            size="lg"
            disabled={isAnalyzing}
          >
            <FileUp className="mr-2" />
            Adicionar Arquivo (PDF, Imagem)
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" />

          <Button 
            onClick={startCamera} 
            className="flex-1 py-6 text-base sm:py-4" 
            size="lg" 
            variant="secondary"
            disabled={isAnalyzing}
          >
            <Camera className="mr-2" />
            Usar Câmera
          </Button>
        </div>

        <div className="space-y-3 min-h-24">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-muted-foreground">Exames na Fila para Análise:</h3>
            {isAnalyzing && (
              <span className="text-sm text-blue-600 font-medium">
                {completedCount}/{stagedFiles.length} concluídos
              </span>
            )}
          </div>
          
          {isAnalyzing && stagedFiles.length > 0 && (
            <div className="space-y-2">
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {analysisPhase === 'individual' && `Analisando arquivos individualmente...`}
                {analysisPhase === 'consolidating' && 'Consolidando análises com equipe de especialistas...'}
                {analysisPhase === 'wellness' && 'Gerando plano de bem-estar personalizado...'}
              </p>
            </div>
          )}
          
          {stagedFiles.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
              Nenhum arquivo adicionado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stagedFiles.map((sf, index) => (
                <Card 
                  key={sf.id} 
                  className={`relative group overflow-hidden transition-all duration-300 ${
                    sf.status === 'analyzing' ? 'ring-2 ring-blue-500 ring-offset-2' :
                    sf.status === 'completed' ? 'ring-2 ring-green-500 ring-offset-2' :
                    sf.status === 'error' ? 'ring-2 ring-red-500 ring-offset-2' : ''
                  }`}
                >
                  {sf.status === 'analyzing' && (
                    <>
                      <div className="absolute inset-0 z-[5] pointer-events-none">
                        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80 blur-sm animate-scan" 
                             style={{ 
                               boxShadow: '0 0 20px 5px rgba(59, 130, 246, 0.5)',
                               animation: 'scan 2s ease-in-out infinite'
                             }} 
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-blue-500/10 z-[4] pointer-events-none animate-pulse" />
                    </>
                  )}

                  <div className="absolute top-1 right-1 z-10 flex gap-1">
                    <div className={`p-1 rounded-full ${
                      sf.status === 'pending' ? 'bg-gray-100' :
                      sf.status === 'analyzing' ? 'bg-blue-100' :
                      sf.status === 'completed' ? 'bg-green-100' :
                      'bg-red-100'
                    }`}>
                      {getStatusIcon(sf.status)}
                    </div>
                    {!isAnalyzing && (
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
                    )}
                  </div>
                  
                  {sf.dataUri.startsWith('data:image') ? (
                    <div 
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setPreviewImage({ dataUri: sf.dataUri, name: sf.name })}
                    >
                      <Image 
                        src={sf.dataUri} 
                        alt={sf.name} 
                        width={400} 
                        height={300} 
                        className="w-full h-48 md:h-56 object-cover" 
                      />
                      <div className="absolute bottom-12 left-0 right-0 text-center text-xs text-white bg-black/50 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Clique para ampliar
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 md:h-56 bg-muted flex items-center justify-center p-2">
                      <FileText className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="p-2 text-xs bg-card/80 space-y-1">
                    <p className="font-semibold truncate">{sf.name}</p>
                    <p className={`text-xs font-medium ${
                      sf.status === 'pending' ? 'text-gray-500' :
                      sf.status === 'analyzing' ? 'text-blue-600' :
                      sf.status === 'completed' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {getStatusText(sf.status)}
                    </p>
                    {sf.error && (
                      <p className="text-xs text-red-500 truncate">{sf.error}</p>
                    )}
                    {sf.analysis?.documentType && sf.status === 'completed' && (
                      <p className="text-xs text-green-600">Tipo: {sf.analysis.documentType}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

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

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || stagedFiles.length === 0 || (limitInfo && !limitInfo.allowed)}
          size="lg"
          className={`w-full transition-all duration-300 ${isAnalyzing ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse' : ''}`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="font-semibold">
                {analysisPhase === 'individual' && `Analisando ${currentFileIndex + 1} de ${stagedFiles.length}...`}
                {analysisPhase === 'consolidating' && 'Consolidando análises...'}
                {analysisPhase === 'wellness' && 'Gerando plano de bem-estar...'}
              </span>
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              <span className="font-semibold">Enviar para Análise Sequencial ({stagedFiles.length})</span>
            </>
          )}
        </Button>

      </CardContent>

      {/* Modal de Visualização Ampliada */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm truncate">{previewImage?.name}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex items-center justify-center overflow-auto">
              <Image
                src={previewImage.dataUri}
                alt={previewImage.name}
                width={1200}
                height={900}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
