
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HeartPulse, Gauge } from 'lucide-react';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';

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


// Helper to generate simulated vital signs data
const generateVitals = (lastVitals: any) => {
    // Heart Rate simulation
    let newHr = lastVitals.hr + (Math.random() - 0.5) * 4;
    newHr = Math.max(55, Math.min(130, newHr)); // Clamp between 55 and 130 bpm

    // Blood Pressure simulation
    let newSys = lastVitals.systolic + (Math.random() - 0.5) * 3;
    let newDia = lastVitals.diastolic + (Math.random() - 0.5) * 2;
    newSys = Math.max(100, Math.min(160, newSys));
    newDia = Math.max(60, Math.min(100, newDia));

    return {
        hr: Math.round(newHr),
        systolic: Math.round(newSys),
        diastolic: Math.round(newDia)
    };
};

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
    const [currentVitals, setCurrentVitals] = useState({ hr: 75, systolic: 120, diastolic: 80 });

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentVitals(prev => {
                const newVitals = generateVitals(prev);
                setVitalsData(currentData => {
                    const now = new Date();
                    const newDataPoint = {
                        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        ...newVitals
                    };
                    const updatedData = [...currentData, newDataPoint];
                    if (updatedData.length > MAX_DATA_POINTS) {
                        return updatedData.slice(updatedData.length - MAX_DATA_POINTS);
                    }
                    return updatedData;
                });
                return newVitals;
            });
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, []);

    const hrColor = getStatusColor(currentVitals.hr, 'hr');
    const bpColor = getStatusColor(currentVitals.systolic, 'bp');

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {/* Status Cards */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <HeartPulse className={`h-6 w-6 ${hrColor}`} /> Frequência Cardíaca
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className={`text-6xl font-bold ${hrColor}`}>{currentVitals.hr}</p>
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
                        {currentVitals.systolic}
                        <span className="text-3xl text-muted-foreground">/{currentVitals.diastolic}</span>
                    </p>
                    <p className="text-muted-foreground">mmHg (Sist/Diast)</p>
                </CardContent>
            </Card>
             <Card className="flex items-center justify-center bg-muted/50">
                <CardContent className="pt-6 text-center">
                    <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z"></path><path d="M12 12v-2"></path><path d="M16.2 7.8l-1.4 1.4"></path><path d="M18 12h-2"></path><path d="M16.2 16.2l-1.4-1.4"></path><path d="M12 12v2"></path><path d="M7.8 16.2l1.4-1.4"></path><path d="M6 12H4"></path><path d="M7.8 7.8l1.4 1.4"></path></svg>
                    </div>
                     <p className="font-bold text-6xl">24 <span className="text-3xl text-muted-foreground">°C</span></p>
                    <p className="text-muted-foreground">Temperatura Corporal</p>
                </CardContent>
            </Card>

            {/* Charts */}
            <Card className="md:col-span-3">
                <CardHeader>
                    <CardTitle>Histórico Recente de Sinais Vitais</CardTitle>
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
        </div>
    );
}
