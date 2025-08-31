
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HeartPulse, Gauge, Bot, Loader2 } from 'lucide-react';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { Button } from '../ui/button';
import { summarizeVitals } from '@/ai/flows/summarize-vitals-flow';
import AudioPlayback from './audio-playback';
import { useToast } from '@/hooks/use-toast';


const MAX_DATA_POINTS = 30; // Show last 30 seconds of data

const chartConfig = {
  hr: {
    label: "Batimentos Cardíacos",
    color: "hsl(var(--chart-2))",
  },
  systolic: {
    label: "Pressão Sistólica",
    color: "hsl(var(--chart-1))",
  },
  diastolic: {
    label: "Pressão Diastólica",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;


const getStatusColor = (value: number, type: 'hr' | 'bp') => {
    if (type === 'hr') {
        if (value < 60 || value > 100) return 'text-red-500';
        if (value > 90) return 'text-amber-500';
        return 'text-green-500';
    }
    // For BP, we simplify and just check systolic
    if (value > 140) return 'text-red-500';
    if (value > 130) return 'text-amber-500';
    return 'text-green-500';
}

export default function LiveMonitoringClient() {
    const [vitalsData, setVitalsData] = useState<any[]>([]);
    const [currentVitals, setCurrentVitals] = useState({ hr: 0, systolic: 0, diastolic: 0 });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ summary: string; audioDataUri: string; } | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        // TODO: Implementar a integração com a API do dispositivo vestível aqui.
        // A lógica abaixo deve ser substituída por uma chamada a uma API real (via WebSocket ou polling)
        // para obter os dados do dispositivo do paciente em tempo real.
        
        // Exemplo de como você poderia estruturar a recepção de dados:
        // const webSocket = new WebSocket('wss://sua-api-de-wearables.com/vitals');
        // webSocket.onmessage = (event) => {
        //     const newVitals = JSON.parse(event.data); // { hr: 78, systolic: 122, diastolic: 81 }
        //     setCurrentVitals(newVitals);
        //     setVitalsData(currentData => {
        //          const now = new Date();
        //          const newDataPoint = {
        //              time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        //              ...newVitals
        //          };
        //          const updatedData = [...currentData, newDataPoint];
        //          if (updatedData.length > MAX_DATA_POINTS) {
        //              return updatedData.slice(updatedData.length - MAX_DATA_POINTS);
        //          }
        //          return updatedData;
        //     });
        // };
        // return () => webSocket.close();
    }, []);

    const handleAnalyzeData = async () => {
        if (vitalsData.length < 5) {
             toast({
                variant: 'destructive',
                title: 'Dados Insuficientes',
                description: 'Aguarde mais alguns segundos para coletar mais dados antes de analisar.',
            });
            return;
        }
        setIsAnalyzing(true);
        setAnalysisResult(null);
        try {
            const result = await summarizeVitals({ vitalsData });
            setAnalysisResult(result);
        } catch (error) {
            console.error("Failed to analyze vitals:", error);
            toast({
                variant: 'destructive',
                title: 'Erro na Análise',
                description: 'Não foi possível gerar o resumo dos seus dados. Tente novamente.',
            });
        } finally {
            setIsAnalyzing(false);
        }
    };


    const hrColor = getStatusColor(currentVitals.hr, 'hr');
    const bpColor = getStatusColor(currentVitals.systolic, 'bp');

    return (
        <div className="grid gap-6 md:grid-cols-1">
            <div className="grid gap-6 md:grid-cols-3">
                 {/* Status Cards */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <HeartPulse className={`h-6 w-6 ${hrColor}`} /> Frequência Cardíaca
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-6xl font-bold ${hrColor}`}>{currentVitals.hr > 0 ? currentVitals.hr : '--'}</p>
                        <p className="text-muted-foreground">BPM</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Gauge className={`h-6 w-6 ${bpColor}`} /> Pressão Arterial
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-6xl font-bold ${bpColor}`}>
                            {currentVitals.systolic > 0 ? currentVitals.systolic : '--'}
                            <span className="text-3xl text-muted-foreground">/{currentVitals.diastolic > 0 ? currentVitals.diastolic : '--'}</span>
                        </p>
                        <p className="text-muted-foreground">mmHg (Sist/Diast)</p>
                    </CardContent>
                </Card>
                <Card className="flex items-center justify-center bg-muted/50">
                    <CardContent className="pt-6 text-center">
                        <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z"></path><path d="M12 12v-2"></path><path d="M16.2 7.8l-1.4 1.4"></path><path d="M18 12h-2"></path><path d="M16.2 16.2l-1.4-1.4"></path><path d="M12 12v2"></path><path d="M7.8 16.2l1.4-1.4"></path><path d="M6 12H4"></path><path d="M7.8 7.8l1.4 1.4"></path></svg>
                        </div>
                        <p className="font-bold text-6xl">-- <span className="text-3xl text-muted-foreground">°C</span></p>
                        <p className="text-muted-foreground">Temperatura Corporal</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico Recente de Sinais Vitais</CardTitle>
                    <CardDescription>Aguardando dados do dispositivo do paciente...</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] w-full p-2">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <ResponsiveContainer>
                            <LineChart data={vitalsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="hr" name="Batimentos Cardíacos" stroke="var(--color-hr)" strokeWidth={2} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="systolic" name="Pressão Sistólica" stroke="var(--color-systolic)" strokeWidth={2} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="diastolic" name="Pressão Diastólica" stroke="var(--color-diastolic)" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

             {/* AI Analysis Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot /> Análise dos Dados pela IA
                    </CardTitle>
                    <CardDescription>
                        Clique no botão para gerar um resumo inteligente dos dados coletados até o momento.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleAnalyzeData} disabled={isAnalyzing || vitalsData.length === 0} size="lg" className="w-full md:w-auto">
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...
                            </>
                        ) : "Analisar Dados Atuais"}
                    </Button>
                    
                    {analysisResult && (
                        <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                            <h4 className="font-semibold mb-2">Resumo da Análise:</h4>
                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed mb-4">
                                {analysisResult.summary}
                            </p>
                            <AudioPlayback 
                                textToSpeak={analysisResult.summary}
                                preGeneratedAudioUri={analysisResult.audioDataUri}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    