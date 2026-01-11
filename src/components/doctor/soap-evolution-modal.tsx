"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, Save, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveSoapEvolutionAction } from "@/app/doctor/patients/[id]/actions";

interface SoapEvolutionModalProps {
    patientId: string;
    patientName: string;
}

export default function SoapEvolutionModal({ patientId, patientName }: SoapEvolutionModalProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [soap, setSoap] = useState({
        subjective: "",
        objective: "",
        assessment: "",
        plan: ""
    });

    const handleSave = async () => {
        if (!soap.assessment || !soap.plan) {
            toast({
                title: "Campos obrigatórios",
                description: "Avaliação e Plano são essenciais para a evolução clínica.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const result = await saveSoapEvolutionAction(patientId, soap);
            if (result.success) {
                toast({ title: "Sucesso!", description: result.message });
                setIsOpen(false);
                setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao salvar a evolução.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm rounded-xl">
                    <Stethoscope className="h-4 w-4" />
                    Nova Evolução (SOAP)
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-blue-600" />
                        Evolução Clínica Livre - {patientName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">S - Subjetivo</Label>
                            <Textarea
                                placeholder="Queixas, sintomas e histórico relatado..."
                                value={soap.subjective}
                                onChange={(e) => setSoap({ ...soap, subjective: e.target.value })}
                                className="bg-slate-50 border-slate-200 focus:bg-white min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">O - Objetivo</Label>
                            <Textarea
                                placeholder="Sinais vitais, exame físico, resultados observados..."
                                value={soap.objective}
                                onChange={(e) => setSoap({ ...soap, objective: e.target.value })}
                                className="bg-slate-50 border-slate-200 focus:bg-white min-h-[100px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">A - Avaliação (Diagnóstico/Hipótese)</Label>
                        <Textarea
                            placeholder="Sua conclusão clínica sobre o quadro atual..."
                            value={soap.assessment}
                            onChange={(e) => setSoap({ ...soap, assessment: e.target.value })}
                            className="bg-slate-50 border-slate-200 focus:bg-white min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">P - Plano (Conduta)</Label>
                        <Textarea
                            placeholder="Tratamento, solicitações de exames, medicamentos, orientações e retorno..."
                            value={soap.plan}
                            onChange={(e) => setSoap({ ...soap, plan: e.target.value })}
                            className="bg-slate-50 border-slate-200 focus:bg-white min-h-[100px]"
                        />
                    </div>

                    <Button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md h-12">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        {loading ? "Salvando Evolução..." : "Salvar Registro Clínico"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
