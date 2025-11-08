
"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HeartPulse, Gauge, Bot, Loader2, Bluetooth, BluetoothConnected, BluetoothOff } from 'lucide-react';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { Button } from '../ui/button';
import { summarizeVitals } from '@/ai/flows/summarize-vitals-flow';
import AudioPlayback from './audio-playback';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

// Web Bluetooth API types
interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<any>;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListener): void;
}

interface Navigator {
  bluetooth?: {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  };
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: string[];
}

interface BluetoothLEScanFilter {
  services?: string[];
}


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
        if (value < 60 || value > 100) return 'text-red-700 dark:text-red-400';
        if (value > 90) return 'text-amber-700 dark:text-amber-400';
        return 'text-green-700 dark:text-green-400';
    }
    // For BP, we simplify and just check systolic
    if (value > 140) return 'text-red-700 dark:text-red-400';
    if (value > 130) return 'text-amber-700 dark:text-amber-400';
    return 'text-green-700 dark:text-green-400';
}

export default function LiveMonitoringClient() {
    const [vitalsData, setVitalsData] = useState<any[]>([]);
    const [currentVitals, setCurrentVitals] = useState({ hr: 0, systolic: 0, diastolic: 0 });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ summary: string; audioDataUri: string; } | null>(null);
    const { toast } = useToast();
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);

    const handleHeartRateNotification = (event: Event) => {
        const value = (event.target as any).value as DataView;
        const flags = value.getUint8(0);
        const rate16Bits = (flags & 0x1) !== 0;
        let heartRate: number;
        if (rate16Bits) {
            heartRate = value.getUint16(1, true);
        } else {
            heartRate = value.getUint8(1);
        }
        
        setCurrentVitals(prev => ({...prev, hr: heartRate }));
        setVitalsData(currentData => {
             const now = new Date();
             const lastVitals = currentData.length > 0 ? currentData[currentData.length - 1] : { systolic: 0, diastolic: 0 };
             const newDataPoint = {
                 time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                 hr: heartRate,
                 // BP data is not available from standard heart rate service, so we keep it static for now
                 systolic: lastVitals.systolic, 
                 diastolic: lastVitals.diastolic,
             };
             const updatedData = [...currentData, newDataPoint];
             return updatedData.length > MAX_DATA_POINTS ? updatedData.slice(1) : updatedData;
        });
    };

    const disconnectDevice = useCallback(async () => {
        if (bluetoothDevice && bluetoothDevice.gatt?.connected) {
             bluetoothDevice.gatt.disconnect();
        }
        setBluetoothDevice(null);
        setConnectionStatus('disconnected');
        toast({ title: "Dispositivo Desconectado", description: "A conexão Bluetooth foi encerrada." });
    }, [bluetoothDevice, toast]);

    const connectToDevice = async () => {
        const nav = navigator as Navigator;
        if (!nav.bluetooth) {
            toast({ variant: 'destructive', title: 'Bluetooth não suportado', description: 'Seu navegador não suporta a Web Bluetooth API.' });
            setConnectionStatus('error');
            return;
        }

        setConnectionStatus('connecting');
        try {
            const device = await nav.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                optionalServices: ['battery_service']
            });
            
            setBluetoothDevice(device);
            device.addEventListener('gattserverdisconnected', () => {
                setConnectionStatus('disconnected');
                toast({ title: "Dispositivo Desconectado", description: "A conexão foi perdida.", variant: "destructive" });
            });
            
            const server = await device.gatt?.connect();
            setConnectionStatus('connected');
            toast({ title: "Conectado!", description: `Conectado com sucesso a ${device.name}.` });

            const service = await server?.getPrimaryService('heart_rate');
            const characteristic = await service?.getCharacteristic('heart_rate_measurement');
            await characteristic?.startNotifications();

            characteristic?.addEventListener('characteristicvaluechanged', handleHeartRateNotification);

        } catch (error) {
            console.error('Falha na conexão Bluetooth:', error);
            toast({ variant: 'destructive', title: 'Falha na Conexão', description: 'Não foi possível conectar ao dispositivo. Tente novamente.' });
            setConnectionStatus('error');
        }
    };


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

    const renderConnectionButton = () => {
        switch (connectionStatus) {
            case 'connecting':
                return <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Conectando...</Button>;
            case 'connected':
                return <Button variant="destructive" onClick={disconnectDevice}><BluetoothOff className="mr-2" /> Desconectar</Button>;
            case 'disconnected':
            case 'error':
            default:
                return <Button onClick={connectToDevice}><Bluetooth className="mr-2" /> Conectar Dispositivo Bluetooth</Button>;
        }
    }

    return (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-1">
             <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-base sm:text-lg">Controle de Conexão</span>
                        {connectionStatus === 'connected' && (
                            <span className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 text-green-700 dark:text-green-400">
                                <BluetoothConnected className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="truncate">Conectado a {bluetoothDevice?.name}</span>
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Use o botão abaixo para conectar ou desconectar seu monitor cardíaco via Bluetooth.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    {renderConnectionButton()}
                     {connectionStatus === 'error' && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTitle className="text-sm">Erro de Conexão</AlertTitle>
                            <AlertDescription className="text-xs">
                                Não foi possível conectar. Verifique se o Bluetooth está ativo e o dispositivo está próximo.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                 {/* Status Cards */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                            <HeartPulse className={`h-5 w-5 sm:h-6 sm:w-6 ${hrColor}`} /> 
                            <span className="truncate">Frequência Cardíaca</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                        <p className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${hrColor}`}>
                            {currentVitals.hr > 0 ? currentVitals.hr : '--'}
                        </p>
                        <p className="text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground">BPM</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                            <Gauge className={`h-5 w-5 sm:h-6 sm:w-6 ${bpColor}`} /> 
                            <span className="truncate">Pressão Arterial</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                        <p className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${bpColor}`}>
                            {currentVitals.systolic > 0 ? currentVitals.systolic : '--'}
                            <span className="text-2xl sm:text-3xl text-foreground/70 dark:text-muted-foreground">
                                /{currentVitals.diastolic > 0 ? currentVitals.diastolic : '--'}
                            </span>
                        </p>
                        <p className="text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground">mmHg (Sist/Diast)</p>
                    </CardContent>
                </Card>
                <Card className="flex items-center justify-center bg-muted/50 sm:col-span-2 lg:col-span-1">
                    <CardContent className="p-4 sm:p-6 text-center">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z"></path><path d="M12 12v-2"></path><path d="M16.2 7.8l-1.4 1.4"></path><path d="M18 12h-2"></path><path d="M16.2 16.2l-1.4-1.4"></path><path d="M12 12v2"></path><path d="M7.8 16.2l1.4-1.4"></path><path d="M6 12H4"></path><path d="M7.8 7.8l1.4 1.4"></path></svg>
                        </div>
                        <p className="font-bold text-4xl sm:text-5xl lg:text-6xl">
                            -- <span className="text-2xl sm:text-3xl text-foreground/70 dark:text-muted-foreground">°C</span>
                        </p>
                        <p className="text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground">Temperatura Corporal</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Histórico Recente de Sinais Vitais</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                         {connectionStatus === 'connected' ? 'Recebendo dados em tempo real...' : 'Aguardando conexão com o dispositivo do paciente...'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] sm:h-[400px] w-full p-2 sm:p-4">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <ResponsiveContainer>
                            <LineChart data={vitalsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="time" 
                                    stroke="#888888" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis yAxisId="left" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
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
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Bot className="h-5 w-5 sm:h-6 sm:w-6" /> 
                        <span>Análise dos Dados pela IA</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Clique no botão para gerar um resumo inteligente dos dados coletados até o momento.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <Button 
                        onClick={handleAnalyzeData} 
                        disabled={isAnalyzing || vitalsData.length === 0} 
                        size="lg" 
                        className="w-full text-sm sm:text-base"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...
                            </>
                        ) : "Analisar Dados Atuais"}
                    </Button>
                    
                    {analysisResult && (
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 border border-border rounded-lg bg-muted/50">
                            <h4 className="font-semibold mb-2 text-sm sm:text-base text-foreground/60 dark:text-foreground">
                                Resumo da Análise:
                            </h4>
                            <p className="text-xs sm:text-sm text-foreground/60 dark:text-foreground whitespace-pre-wrap leading-relaxed mb-4">
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

    