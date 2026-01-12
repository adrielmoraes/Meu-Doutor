'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Loader2, AlertCircle } from 'lucide-react';
import { getMemedTokenAction } from '@/app/doctor/actions';
import { useToast } from '@/hooks/use-toast';

interface MemedPrescriptionWidgetProps {
    doctor: any;
    patient: any;
    onSuccess?: (prescriptionData: any) => void;
    onClose?: () => void;
}

declare global {
    interface Window {
        MdHub: any;
    }
}

export default function MemedPrescriptionWidget({ doctor, patient, onSuccess, onClose }: MemedPrescriptionWidgetProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function initMemed() {
            try {
                const result = await getMemedTokenAction();
                if (result.success && result.token) {
                    setToken(result.token);
                } else {
                    setError(result.message || 'Erro ao obter token da Memed.');
                }
            } catch (err) {
                setError('Falha na comunicação com o servidor.');
            } finally {
                setLoading(false);
            }
        }
        initMemed();
    }, []);

    useEffect(() => {
        if (token && typeof window !== 'undefined' && window.MdHub) {
            // Configurar eventos
            window.MdHub.event.add('prescricaoImpressa', (prescriptionData: any) => {
                toast({ title: 'Receita Emitida!', description: 'A receita da Memed foi gerada e enviada ao paciente.' });
                if (onSuccess) onSuccess(prescriptionData);
            });

            // Configurar paciente
            window.MdHub.command.send('plataforma.prescricao', 'setPaciente', {
                idExterno: patient.id,
                nome: patient.name,
                cpf: patient.cpf,
                telefone: patient.phone,
                endereco: patient.address || '',
                cidade: patient.city || ''
            });
        }
    }, [token, patient, toast, onSuccess]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium">Iniciando ambiente Memed...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex items-start gap-4 text-red-700">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <div>
                    <h4 className="font-bold">Erro de Integração</h4>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[600px] w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
            {token && (
                <>
                    <Script
                        src="https://gemed.memed.com.br/backend-scripts/portal-prescricao.js"
                        data-token={token}
                        onLoad={() => {
                            console.log('Memed SDK Loaded');
                        }}
                    />
                    <div id="memed-container" className="w-full h-full">
                        {/* O widget da Memed será renderizado aqui ou como um overlay dependendo da config */}
                        <div className="flex flex-col items-center justify-center p-20 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-4" />
                            <p className="text-slate-400">Aguardando interface da Memed...</p>
                            <p className="text-xs text-slate-300 mt-2">Se a interface não carregar, verifique se há bloqueadores de pop-up.</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
