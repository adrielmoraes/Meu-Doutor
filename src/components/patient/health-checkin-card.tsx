'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Scale, Ruler, Calculator, Save, Loader2, AlertTriangle, CheckCircle2, TrendingUp, Heart } from 'lucide-react';
import { updatePatientHealthDataAction } from '@/app/patient/dashboard/actions';

interface HealthCheckinCardProps {
    patientId: string;
    initialWeight?: string | null;
    initialHeight?: string | null;
    initialSymptoms?: string;
}

function calculateBMI(weightKg: number, heightCm: number): number {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
}

function getBMICategory(bmi: number): { label: string; color: string; bgColor: string; borderColor: string; icon: 'success' | 'warning' | 'danger' } {
    if (bmi < 18.5) return { label: 'Abaixo do Peso', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30', borderColor: 'border-amber-300 dark:border-amber-700', icon: 'warning' };
    if (bmi < 25) return { label: 'Peso Normal', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', borderColor: 'border-emerald-300 dark:border-emerald-700', icon: 'success' };
    if (bmi < 30) return { label: 'Sobrepeso', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30', borderColor: 'border-amber-300 dark:border-amber-700', icon: 'warning' };
    if (bmi < 35) return { label: 'Obesidade Grau I', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/30', borderColor: 'border-orange-300 dark:border-orange-700', icon: 'warning' };
    if (bmi < 40) return { label: 'Obesidade Grau II', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-950/30', borderColor: 'border-red-300 dark:border-red-700', icon: 'danger' };
    return { label: 'Obesidade Grau III (Mórbida)', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-950/50', borderColor: 'border-red-400 dark:border-red-700', icon: 'danger' };
}

export default function HealthCheckinCard({ patientId, initialWeight, initialHeight, initialSymptoms = '' }: HealthCheckinCardProps) {
    const { toast } = useToast();

    const [savedWeight, setSavedWeight] = useState(initialWeight || '');
    const [savedHeight, setSavedHeight] = useState(initialHeight || '');
    const [savedSymptoms, setSavedSymptoms] = useState(initialSymptoms);

    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [symptoms, setSymptoms] = useState('');

    const [isExpanded, setIsExpanded] = useState(!(initialWeight || initialHeight || initialSymptoms));
    const [isSaving, setIsSaving] = useState(false);

    const displayWeight = isExpanded ? (weight || savedWeight) : savedWeight;
    const displayHeight = isExpanded ? (height || savedHeight) : savedHeight;

    const bmiData = useMemo(() => {
        const w = parseFloat(displayWeight.replace(',', '.'));
        const h = parseFloat(displayHeight.replace(',', '.'));
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return null;
        const bmi = calculateBMI(w, h);
        const category = getBMICategory(bmi);
        return { value: bmi.toFixed(1), ...category };
    }, [displayWeight, displayHeight]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const finalWeight = weight || savedWeight;
            const finalHeight = height || savedHeight;
            const finalSymptoms = symptoms || savedSymptoms;

            const result = await updatePatientHealthDataAction({
                weight: finalWeight || undefined,
                height: finalHeight || undefined,
                reportedSymptoms: finalSymptoms || undefined,
            });

            if (result.success) {
                setSavedWeight(finalWeight);
                setSavedHeight(finalHeight);
                setSavedSymptoms(finalSymptoms);

                setWeight('');
                setHeight('');
                setSymptoms('');
                setIsExpanded(false);
            }

            toast({
                title: result.success ? '✅ Check-in Salvo!' : 'Erro',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
                className: result.success ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 border-green-300' : '',
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Falha ao salvar os dados.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800/80 dark:to-slate-900/80 border-blue-200/50 dark:border-blue-800/30 backdrop-blur-xl shadow-lg overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                            <Heart className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Check-in de Saúde</CardTitle>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Atualize seus dados para melhorar as recomendações da IA</p>
                        </div>
                    </div>
                    {!isExpanded ? (
                        <Button onClick={() => setIsExpanded(true)} variant="outline" size="sm" className="text-xs font-semibold border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                            Atualizar Dados
                        </Button>
                    ) : (
                        (savedWeight || savedHeight || savedSymptoms) ? (
                            <Button onClick={() => setIsExpanded(false)} variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                Cancelar
                            </Button>
                        ) : (
                            <Badge variant="outline" className="text-[10px] font-semibold border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50">
                                IMC + Queixas
                            </Badge>
                        )
                    )}
                </div>
            </CardHeader>

            {!isExpanded && (savedWeight || savedHeight || savedSymptoms) && (
                <CardContent className="space-y-4 animate-in fade-in-50 duration-300">
                    {bmiData && (
                        <div className={`p-4 rounded-xl border ${bmiData.borderColor} ${bmiData.bgColor} transition-all duration-300`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-sm">
                                        <Calculator className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Seu IMC Atual</p>
                                        <p className={`text-2xl font-extrabold tracking-tight ${bmiData.color}`}>{bmiData.value}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className={`${bmiData.bgColor} ${bmiData.color} border ${bmiData.borderColor} font-semibold text-xs`}>
                                        {bmiData.icon === 'success' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                        {bmiData.icon === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                        {bmiData.icon === 'danger' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                        {bmiData.label}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}
                    {savedSymptoms && (
                        <div className="p-3 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5" />
                                Últimas queixas relatadas:
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{savedSymptoms}</p>
                        </div>
                    )}
                </CardContent>
            )}

            {isExpanded && (
                <CardContent className="space-y-5 animate-in fade-in-50 slide-in-from-top-2 duration-300">
                    {/* Dados Antropométricos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Scale className="h-3.5 w-3.5 text-blue-500" />
                                Peso (kg) {savedWeight && <span className="text-xs text-slate-400 font-normal ml-1">Atual: {savedWeight}</span>}
                            </Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                placeholder={savedWeight ? `Ex: ${savedWeight}` : "Ex: 75.5"}
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Ruler className="h-3.5 w-3.5 text-blue-500" />
                                Altura (cm) {savedHeight && <span className="text-xs text-slate-400 font-normal ml-1">Atual: {savedHeight}</span>}
                            </Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                placeholder={savedHeight ? `Ex: ${savedHeight}` : "Ex: 175"}
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* IMC Resultado Prévia */}
                    {bmiData && (weight || height) && (
                        <div className={`p-3 rounded-lg border ${bmiData.borderColor} ${bmiData.bgColor} transition-all duration-300 bg-opacity-50`}>
                            <div className="flex items-center justify-between">
                                <p className={`text-sm font-semibold ${bmiData.color}`}>Prévia IMC: {bmiData.value}</p>
                                <Badge className={`${bmiData.bgColor} ${bmiData.color} border-none font-semibold text-[10px] px-1.5 py-0`}>
                                    {bmiData.label}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* Queixas / Sintomas */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                            Como você está se sentindo hoje?
                        </Label>
                        <Textarea
                            placeholder="Relate aqui suas novas queixas, dores, dificuldades, qualidade do sono..."
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            rows={4}
                            className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm"
                        />
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Essas informações serão usadas pela IA para personalizar suas recomendações e auxiliar seu médico.
                        </p>
                    </div>

                    {/* Botão Salvar */}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || (!weight && !height && !symptoms)}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 h-11 rounded-xl"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Salvar Atualização
                            </>
                        )}
                    </Button>
                </CardContent>
            )}
        </Card>
    );
}
