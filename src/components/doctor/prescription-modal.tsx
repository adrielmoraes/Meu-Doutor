'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash, FileSignature, Cloud, FileText, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionModalProps {
    doctor: any;
    patients: any[]; // List of patients to select from
}

export default function PrescriptionModal({ doctor, patients }: PrescriptionModalProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'form' | 'sign'>('form');
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [medications, setMedications] = useState([
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
    const [instructions, setInstructions] = useState('');
    const [currentPrescriptionId, setCurrentPrescriptionId] = useState<string | null>(null);

    // Signing State
    const [pfxFile, setPfxFile] = useState<File | null>(null);
    const [pfxPassword, setPfxPassword] = useState('');

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const updateMedication = (index: number, field: string, value: string) => {
        const newMeds = [...medications];
        (newMeds[index] as any)[field] = value;
        setMedications(newMeds);
    };

    const handleGenerateDraft = async () => {
        if (!selectedPatientId) {
            toast({ title: "Selecione um paciente", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/prescriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: doctor.id,
                    patientId: selectedPatientId,
                    medications,
                    instructions
                })
            });

            if (!res.ok) throw new Error('Falha ao criar rascunho');

            const data = await res.json();
            setCurrentPrescriptionId(data.id);
            setStep('sign');
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível gerar a prescrição.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSignA1 = async () => {
        if (!pfxFile || !pfxPassword || !currentPrescriptionId) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('pfx', pfxFile);
            formData.append('password', pfxPassword);

            const res = await fetch(`/api/prescriptions/${currentPrescriptionId}/sign/a1`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erro na assinatura');
            }

            const data = await res.json();
            toast({ title: "Sucesso!", description: "Prescrição assinada com sucesso." });

            // Open PDF
            window.open(data.url, '_blank');
            setIsOpen(false);
            resetForm();

        } catch (error: any) {
            toast({ title: "Erro na Assinatura", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSignBry = () => {
        if (!currentPrescriptionId) return;
        // Redirect to Auth
        window.location.href = `/api/prescriptions/${currentPrescriptionId}/sign/bry/init`;
    };

    const resetForm = () => {
        setStep('form');
        setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        setInstructions('');
        setPfxFile(null);
        setPfxPassword('');
        setCurrentPrescriptionId(null);
        setSelectedPatientId('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
                    <FileSignature className="h-4 w-4" />
                    Nova Prescrição
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">Nova Prescrição Eletrônica</DialogTitle>
                </DialogHeader>

                {step === 'form' ? (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Paciente</Label>
                            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                                <SelectTrigger className="bg-white border-slate-300 text-slate-900 focus:ring-blue-500">
                                    <SelectValue placeholder="Selecione o paciente..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                                    {patients.map(p => (
                                        <SelectItem key={p.id} value={p.id} className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer">
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-700 font-medium">Medicamentos</Label>
                                <Button variant="outline" size="sm" onClick={addMedication} className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                                </Button>
                            </div>

                            {medications.map((med, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 items-start shadow-sm hover:border-blue-200 transition-colors">
                                    <div className="col-span-12 md:col-span-4 space-y-1">
                                        <Input
                                            placeholder="Nome do Medicamento"
                                            value={med.name}
                                            onChange={e => updateMedication(index, 'name', e.target.value)}
                                            className="bg-white border-slate-300 h-9 text-sm focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-2 space-y-1">
                                        <Input
                                            placeholder="Dosagem"
                                            value={med.dosage}
                                            onChange={e => updateMedication(index, 'dosage', e.target.value)}
                                            className="bg-white border-slate-300 h-9 text-sm focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-2 space-y-1">
                                        <Input
                                            placeholder="Frequência"
                                            value={med.frequency}
                                            onChange={e => updateMedication(index, 'frequency', e.target.value)}
                                            className="bg-white border-slate-300 h-9 text-sm focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-2 space-y-1">
                                        <Input
                                            placeholder="Duração"
                                            value={med.duration}
                                            onChange={e => updateMedication(index, 'duration', e.target.value)}
                                            className="bg-white border-slate-300 h-9 text-sm focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-2 flex justify-end items-center">
                                        <Button variant="ghost" size="icon" onClick={() => removeMedication(index)} className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="col-span-12 mt-1">
                                        <Input
                                            placeholder="Instruções adicionais (opcional)"
                                            value={med.instructions}
                                            onChange={e => updateMedication(index, 'instructions', e.target.value)}
                                            className="bg-white border-slate-300 h-8 text-xs text-slate-600 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-700 font-medium">Observações Gerais</Label>
                            <Textarea
                                value={instructions}
                                onChange={e => setInstructions(e.target.value)}
                                className="bg-white border-slate-300 text-slate-900 min-h-[100px] focus:border-blue-500"
                                placeholder="Orientações gerais para o paciente..."
                            />
                        </div>

                        <Button onClick={handleGenerateDraft} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                            Revisar e Assinar
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                            <div className="bg-white p-3 rounded-full inline-block mb-3 shadow-sm">
                                <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-blue-900">Prescrição Gerada</h3>
                            <p className="text-sm text-blue-700 mb-4 font-medium">Escolha como deseja assinar o documento</p>
                        </div>

                        <Tabs defaultValue="a1" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
                                <TabsTrigger value="a1" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-slate-600 font-medium">Certificado A1 (Arquivo)</TabsTrigger>
                                <TabsTrigger value="cloud" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-slate-600 font-medium">Nuvem (BirdID/Vidaas)</TabsTrigger>
                            </TabsList>

                            <TabsContent value="a1" className="space-y-5 pt-4">
                                <div className="space-y-3">
                                    <Label className="text-slate-700 font-medium">Arquivo do Certificado (.pfx ou .p12)</Label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Cloud className="w-8 h-8 mb-3 text-slate-400" />
                                                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                                <p className="text-xs text-slate-400">PFX ou P12</p>
                                            </div>
                                            <Input
                                                type="file"
                                                accept=".pfx,.p12"
                                                onChange={(e) => setPfxFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    {pfxFile && (
                                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 p-2 rounded-md">
                                            <Check className="h-4 w-4" />
                                            Arquivo selecionado: {pfxFile.name}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-medium">Senha do Certificado</Label>
                                    <Input
                                        type="password"
                                        value={pfxPassword}
                                        onChange={(e) => setPfxPassword(e.target.value)}
                                        className="bg-white border-slate-300 focus:border-blue-500"
                                        placeholder="Digite a senha do certificado..."
                                    />
                                </div>
                                <Button onClick={handleSignA1} disabled={!pfxFile || !pfxPassword || loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md h-11 text-base">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
                                    Assinar Digitalmente
                                </Button>
                            </TabsContent>

                            <TabsContent value="cloud" className="space-y-4 pt-4">
                                <div className="bg-sky-50 border border-sky-200 p-5 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-sky-800 font-bold text-lg">
                                        <Cloud className="h-6 w-6 text-sky-600" />
                                        Assinatura em Nuvem (BRy Cloud)
                                    </div>
                                    <p className="text-sm text-sky-700 leading-relaxed">
                                        Você será redirecionado para o portal seguro da BRy Tecnologia.
                                        Suporte nativo para certificados em nuvem como <strong>BirdID, Vidaas, SafeID, NeoID</strong> e outros.
                                    </p>
                                </div>
                                <Button onClick={handleSignBry} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md h-11 text-base">
                                    Ir para Portal de Assinatura
                                </Button>
                            </TabsContent>
                        </Tabs>

                        <Button variant="ghost" onClick={() => setStep('form')} className="w-full mt-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                            Voltar e Editar
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
