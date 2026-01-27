'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash, FileSignature, Cloud, FileText, Loader2, Check, Sparkles, ExternalLink, Eye, Edit, Search, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateDocumentDraftAction, searchMemedMedicinesAction, createMemedDocumentAction } from "@/app/doctor/actions";
import MemedPrescriptionWidget from './memed-prescription-widget';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MedicationSuggestion {
    id: string;
    name: string;
    presentation?: string;
    manufacturer?: string;
}

interface ValidationErrors {
    patient?: string;
    title?: string;
    medications?: string;
    instructions?: string;
}

interface PrescriptionModalProps {
    doctor: any;
    patients: any[]; // List of patients to select from
    initialPatientId?: string;
    variant?: 'default' | 'compact';
}

export default function PrescriptionModal({ doctor, patients, initialPatientId, variant = 'default' }: PrescriptionModalProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'form' | 'sign'>('form');
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
    const [docType, setDocType] = useState<'receita' | 'atestado' | 'laudo' | 'outro' | 'memed'>('receita');
    const [docTitle, setDocTitle] = useState('');
    const [medications, setMedications] = useState([
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
    const [instructions, setInstructions] = useState('');
    const [isGeneratingIA, setIsGeneratingIA] = useState(false);
    const [currentPrescriptionId, setCurrentPrescriptionId] = useState<string | null>(null);
    const [memedPdfUrl, setMemedPdfUrl] = useState<string | null>(null);
    const [isCreatingMemed, setIsCreatingMemed] = useState(false);

    // Markdown Preview State
    const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

    // Medication Autocomplete State
    const [medicationSuggestions, setMedicationSuggestions] = useState<{ [key: number]: MedicationSuggestion[] }>({});
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
    const [isSearchingMeds, setIsSearchingMeds] = useState<{ [key: number]: boolean }>({});
    const searchTimeoutRef = useRef<{ [key: number]: NodeJS.Timeout }>({});

    // Validation State
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    // Signing State
    const [pfxFile, setPfxFile] = useState<File | null>(null);
    const [pfxPassword, setPfxPassword] = useState('');

    // Debounced medication search
    const searchMedications = useCallback(async (query: string, index: number) => {
        if (query.length < 3) {
            setMedicationSuggestions(prev => ({ ...prev, [index]: [] }));
            return;
        }

        setIsSearchingMeds(prev => ({ ...prev, [index]: true }));
        
        try {
            const result = await searchMemedMedicinesAction(query);
            if (result.success && result.results) {
                setMedicationSuggestions(prev => ({
                    ...prev,
                    [index]: result.results.map((med: any) => ({
                        id: med.id || med.nome,
                        name: med.nome || med.name,
                        presentation: med.apresentacao || med.presentation,
                        manufacturer: med.laboratorio || med.manufacturer
                    }))
                }));
            }
        } catch (error) {
            console.error('Erro ao buscar medicamentos:', error);
        } finally {
            setIsSearchingMeds(prev => ({ ...prev, [index]: false }));
        }
    }, []);

    // Validation function
    const validateForm = useCallback((): boolean => {
        const errors: ValidationErrors = {};
        let isValid = true;

        if (!selectedPatientId) {
            errors.patient = 'Selecione um paciente';
            isValid = false;
        }

        if ((docType === 'receita' || docType === 'memed')) {
            const validMeds = medications.filter(m => m.name.trim());
            if (validMeds.length === 0) {
                errors.medications = 'Adicione pelo menos um medicamento';
                isValid = false;
            } else {
                const incompleteMed = validMeds.find(m => !m.dosage || !m.frequency || !m.duration);
                if (incompleteMed) {
                    errors.medications = 'Preencha dosagem, frequência e duração de todos os medicamentos';
                    isValid = false;
                }
            }
        }

        if (!instructions.trim() && docType !== 'receita' && docType !== 'memed') {
            errors.instructions = 'O conteúdo do documento é obrigatório';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    }, [selectedPatientId, docType, medications, instructions]);

    // Select medication from suggestions
    const selectMedication = (index: number, suggestion: MedicationSuggestion) => {
        const fullName = suggestion.presentation 
            ? `${suggestion.name} - ${suggestion.presentation}`
            : suggestion.name;
        
        const newMeds = [...medications];
        newMeds[index].name = fullName;
        setMedications(newMeds);
        setMedicationSuggestions(prev => ({ ...prev, [index]: [] }));
        setActiveSuggestionIndex(null);
    };

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
        setMedicationSuggestions(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
    };

    const updateMedication = (index: number, field: string, value: string) => {
        const newMeds = [...medications];
        (newMeds[index] as any)[field] = value;
        setMedications(newMeds);

        // Clear validation errors when user starts typing
        if (validationErrors.medications) {
            setValidationErrors(prev => ({ ...prev, medications: undefined }));
        }

        // Debounced search for medication names via Memed API
        if (field === 'name' && (docType === 'receita' || docType === 'memed')) {
            // Clear previous timeout for this index
            if (searchTimeoutRef.current[index]) {
                clearTimeout(searchTimeoutRef.current[index]);
            }

            // Set new timeout for debounced search
            searchTimeoutRef.current[index] = setTimeout(() => {
                searchMedications(value, index);
            }, 300);

            setActiveSuggestionIndex(index);
        }
    };

    const handleAIGenerate = async () => {
        if (!selectedPatientId) {
            toast({ title: "Selecione um paciente", description: "A IA precisa do contexto do paciente para gerar o documento.", variant: "destructive" });
            return;
        }

        setIsGeneratingIA(true);
        try {
            const result = await generateDocumentDraftAction(selectedPatientId, docType === 'memed' ? 'receita' : docType);
            if (result.success && result.draft) {
                if (result.draft.title) setDocTitle(result.draft.title);
                if (result.draft.medications && result.draft.medications.length > 0) {
                    setMedications(result.draft.medications);
                }
                setInstructions(result.draft.instructions);
                toast({ title: "Rascunho gerado!", description: "A IA preencheu o documento com base no histórico do paciente." });
            } else {
                toast({ title: "Erro na IA", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro Inesperado", description: "Não foi possível conectar ao serviço de IA.", variant: "destructive" });
        } finally {
            setIsGeneratingIA(false);
        }
    };

    const handleGenerateDraft = async () => {
        if (!validateForm()) {
            toast({ title: "Campos obrigatórios", description: "Verifique os campos destacados em vermelho.", variant: "destructive" });
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
                    type: docType,
                    title: docTitle || undefined,
                    medications: docType === 'receita' ? medications : [],
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

    const handleMemedSuccess = async (prescriptionData: any) => {
        // Salvar a receita da Memed no nosso banco para o paciente ver no portal
        try {
            const res = await fetch('/api/prescriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: doctor.id,
                    patientId: selectedPatientId,
                    type: 'receita',
                    title: 'Prescrição Digital Memed',
                    externalId: prescriptionData.id,
                    signedPdfUrl: prescriptionData.pdf_url || prescriptionData.show_url,
                    status: 'signed'
                })
            });

            if (res.ok) {
                setIsOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error('Erro ao salvar referência Memed:', error);
        }
    };

    const handleCreateMemedDocument = async () => {
        if (!validateForm()) {
            toast({ title: "Campos obrigatórios", description: "Verifique os campos destacados em vermelho.", variant: "destructive" });
            return;
        }

        setIsCreatingMemed(true);

        try {
            const result = await createMemedDocumentAction({
                patientId: selectedPatientId,
                documentType: docType,
                title: docTitle || undefined,
                medications: (docType === 'receita' || docType === 'memed') ? medications.filter(m => m.name) : undefined,
                observations: instructions,
            });

            if (result.success && result.document) {
                // Save reference to our database
                const res = await fetch('/api/prescriptions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        doctorId: doctor.id,
                        patientId: selectedPatientId,
                        type: docType,
                        title: result.document.title || 'Documento Memed',
                        externalId: result.document.externalId,
                        signedPdfUrl: result.document.signedPdfUrl,
                        status: result.document.status || 'signed',
                    }),
                });

                if (res.ok) {
                    setMemedPdfUrl(result.document.signedPdfUrl);
                    toast({
                        title: "✅ Documento criado com sucesso!",
                        description: "O documento foi gerado e salvo.",
                        className: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 border-green-300",
                    });
                } else {
                    toast({
                        title: "Documento criado, mas não foi possível salvar localmente",
                        description: "O PDF está disponível abaixo.",
                        variant: "default",
                    });
                    setMemedPdfUrl(result.document.signedPdfUrl);
                }
            } else {
                toast({
                    title: "Erro ao criar documento",
                    description: result.message || "Não foi possível criar o documento via Memed.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('[Memed] Erro inesperado:', error);
            toast({
                title: "Erro inesperado",
                description: "Ocorreu um erro ao criar o documento.",
                variant: "destructive",
            });
        } finally {
            setIsCreatingMemed(false);
        }
    };

    const resetForm = () => {
        setStep('form');
        setDocType('receita');
        setDocTitle('');
        setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        setInstructions('');
        setPfxFile(null);
        setPfxPassword('');
        setCurrentPrescriptionId(null);
        setSelectedPatientId('');
        setMemedPdfUrl(null);
        setIsCreatingMemed(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
                {variant === 'compact' ? (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm rounded-lg px-3 py-2 h-9 gap-1.5" title="Gerar Prescrição/Documento">
                        <FileSignature className="h-4 w-4" />
                        <span className="text-xs">Prescrição</span>
                    </Button>
                ) : (
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm rounded-xl">
                        <FileSignature className="h-4 w-4" />
                        Novo Documento
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">Novo Documento Médico Assinado</DialogTitle>
                </DialogHeader>

                {step === 'form' ? (
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Tipo de Documento</Label>
                                <Select value={docType} onValueChange={(v: any) => setDocType(v)}>
                                    <SelectTrigger className="bg-white border-slate-300 text-slate-900 focus:ring-blue-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                                        <SelectItem value="receita">Receita Médica (Interna)</SelectItem>
                                        <SelectItem value="memed" className="text-blue-600 font-bold">💊 Prescrição Digital Memed</SelectItem>
                                        <SelectItem value="atestado">Atestado Médico</SelectItem>
                                        <SelectItem value="laudo">Laudo Clínico</SelectItem>
                                        <SelectItem value="outro">Outro Documento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-700 font-medium">Título do Documento (Opcional)</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAIGenerate}
                                    disabled={isGeneratingIA || !selectedPatientId}
                                    className="relative h-8 px-4 text-xs font-semibold transition-all duration-300 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 gap-2 overflow-hidden group"
                                >
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <span className="relative z-10 flex items-center gap-2">
                                        {isGeneratingIA ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-3.5 w-3.5" />
                                        )}
                                        Gerar com IA
                                    </span>
                                </Button>
                            </div>
                            <Input
                                value={docTitle}
                                onChange={e => setDocTitle(e.target.value)}
                                placeholder="Ex: Receita Especial, Atestado de Comparecimento..."
                                className="bg-white border-slate-300"
                            />
                        </div>

                        {(docType === 'receita' || docType === 'memed') && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-slate-700 font-medium">Medicamentos</Label>
                                        {validationErrors.medications && (
                                            <span className="flex items-center gap-1 text-xs text-red-600">
                                                <AlertCircle className="h-3 w-3" />
                                                {validationErrors.medications}
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        onClick={addMedication}
                                        size="sm"
                                        className="relative h-9 px-5 font-semibold transition-all duration-300 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 gap-2 overflow-hidden group"
                                    >
                                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <span className="relative z-10 flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            Adicionar
                                        </span>
                                    </Button>
                                </div>

                                {medications.map((med, index) => (
                                    <div key={index} className={`grid grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl border items-start shadow-sm transition-colors ${validationErrors.medications && (!med.name || !med.dosage || !med.frequency || !med.duration) ? 'border-red-300 bg-red-50/50' : 'border-slate-200 hover:border-blue-200'}`}>
                                        <div className="col-span-12 md:col-span-4 space-y-1 relative">
                                            <div className="relative">
                                                <Input
                                                    placeholder="Nome do Medicamento *"
                                                    value={med.name}
                                                    onChange={e => updateMedication(index, 'name', e.target.value)}
                                                    onFocus={() => setActiveSuggestionIndex(index)}
                                                    onBlur={() => setTimeout(() => setActiveSuggestionIndex(null), 200)}
                                                    className={`bg-white border-slate-300 h-9 text-sm focus:border-blue-500 pr-8 ${!med.name && validationErrors.medications ? 'border-red-400' : ''}`}
                                                />
                                                {isSearchingMeds[index] && (
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Medication Suggestions Dropdown */}
                                            {activeSuggestionIndex === index && medicationSuggestions[index]?.length > 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {medicationSuggestions[index].map((suggestion, suggIdx) => (
                                                        <button
                                                            key={suggestion.id || suggIdx}
                                                            type="button"
                                                            onClick={() => selectMedication(index, suggestion)}
                                                            className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-slate-100 last:border-0"
                                                        >
                                                            <div className="font-medium text-sm text-slate-800">{suggestion.name}</div>
                                                            {suggestion.presentation && (
                                                                <div className="text-xs text-slate-500">{suggestion.presentation}</div>
                                                            )}
                                                            {suggestion.manufacturer && (
                                                                <div className="text-xs text-slate-400">{suggestion.manufacturer}</div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {/* No results indicator */}
                                            {activeSuggestionIndex === index && !isSearchingMeds[index] && med.name.length >= 3 && medicationSuggestions[index]?.length === 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <Search className="h-4 w-4" />
                                                        <span>Nenhum medicamento encontrado</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-span-6 md:col-span-2 space-y-1">
                                            <Input
                                                placeholder="Dosagem *"
                                                value={med.dosage}
                                                onChange={e => updateMedication(index, 'dosage', e.target.value)}
                                                className={`bg-white border-slate-300 h-9 text-sm focus:border-blue-500 ${!med.dosage && validationErrors.medications ? 'border-red-400' : ''}`}
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2 space-y-1">
                                            <Input
                                                placeholder="Frequência *"
                                                value={med.frequency}
                                                onChange={e => updateMedication(index, 'frequency', e.target.value)}
                                                className={`bg-white border-slate-300 h-9 text-sm focus:border-blue-500 ${!med.frequency && validationErrors.medications ? 'border-red-400' : ''}`}
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2 space-y-1">
                                            <Input
                                                placeholder="Duração *"
                                                value={med.duration}
                                                onChange={e => updateMedication(index, 'duration', e.target.value)}
                                                className={`bg-white border-slate-300 h-9 text-sm focus:border-blue-500 ${!med.duration && validationErrors.medications ? 'border-red-400' : ''}`}
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2 flex justify-end items-center">
                                            <Button variant="ghost" size="icon" onClick={() => removeMedication(index)} className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="col-span-12 mt-1">
                                            <Input
                                                placeholder="Instruções adicionais (ex: tomar em jejum)"
                                                value={med.instructions}
                                                onChange={e => updateMedication(index, 'instructions', e.target.value)}
                                                className="bg-white border-slate-300 h-8 text-xs text-slate-600 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label className="text-slate-700 font-medium">Conteúdo do Documento / Observações</Label>
                                    <span className="text-xs text-slate-400">(Suporta Markdown)</span>
                                    {validationErrors.instructions && (
                                        <span className="flex items-center gap-1 text-xs text-red-600">
                                            <AlertCircle className="h-3 w-3" />
                                            {validationErrors.instructions}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowMarkdownPreview(false)}
                                        className={`h-7 px-2 text-xs ${!showMarkdownPreview ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Editar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowMarkdownPreview(true)}
                                        className={`h-7 px-2 text-xs ${showMarkdownPreview ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Preview
                                    </Button>
                                </div>
                            </div>
                            {showMarkdownPreview ? (
                                <div className="bg-white border border-slate-300 rounded-md p-4 min-h-[150px] max-h-[300px] overflow-y-auto prose prose-sm prose-slate max-w-none">
                                    {instructions ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{instructions}</ReactMarkdown>
                                    ) : (
                                        <p className="text-slate-400 italic">Nenhum conteúdo para visualizar...</p>
                                    )}
                                </div>
                            ) : (
                                <Textarea
                                    value={instructions}
                                    onChange={e => {
                                        setInstructions(e.target.value);
                                        if (validationErrors.instructions) {
                                            setValidationErrors(prev => ({ ...prev, instructions: undefined }));
                                        }
                                    }}
                                    className={`bg-white border-slate-300 text-slate-900 min-h-[150px] focus:border-blue-500 font-mono text-sm ${validationErrors.instructions ? 'border-red-400' : ''}`}
                                    placeholder={(docType === 'receita' || docType === 'memed') 
                                        ? "## Orientações\n\n- Manter dieta balanceada\n- Evitar bebidas alcoólicas\n- Retornar em 30 dias" 
                                        : "## Conteúdo do Documento\n\nDescreva aqui o conteúdo do atestado ou laudo..."}
                                />
                            )}
                        </div>

                        {docType === 'memed' && selectedPatientId && (
                            <div className="mt-4 border-t pt-6">
                                <MemedPrescriptionWidget
                                    doctor={doctor}
                                    patient={patients.find(p => p.id === selectedPatientId)}
                                    onSuccess={handleMemedSuccess}
                                />
                            </div>
                        )}

                        {memedPdfUrl && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                        <Check className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-green-900 mb-1">Documento Criado!</h4>
                                        <p className="text-sm text-green-800 mb-2">O documento foi gerado com sucesso pela Memed.</p>
                                        <a
                                            href={memedPdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Abrir PDF
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {docType !== 'memed' && !memedPdfUrl && (
                            <div className="space-y-3">
                                <Button
                                    onClick={handleCreateMemedDocument}
                                    disabled={isCreatingMemed || !selectedPatientId}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg transition-all"
                                >
                                    {isCreatingMemed ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Criando documento...
                                        </>
                                    ) : (
                                        <>
                                            <Cloud className="h-4 w-4 mr-2" />
                                            Criar com Memed
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleGenerateDraft}
                                    disabled={loading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md transition-colors border border-emerald-700"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                                    Revisar e Assinar Localmente
                                </Button>
                            </div>
                        )}
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
