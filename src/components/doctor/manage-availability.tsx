
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
// CORREÇÃO: Importar a ação do novo local correto
import { updateDoctorAvailabilityAction } from '@/app/doctor/schedule/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Componente de botão de submit que usa useFormStatus
function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending} className="w-full mt-4">
            {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Salvar Disponibilidade
        </Button>
    );
}

type AvailabilitySlot = { date: string; time: string; available: boolean };

type ManageAvailabilityProps = {
    initialAvailability: AvailabilitySlot[];
    selectedDate: Date | undefined;
};

// Horários padrão para um dia de trabalho
const ALL_DAY_TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

export default function ManageAvailability({ initialAvailability, selectedDate }: ManageAvailabilityProps) {
    const { toast } = useToast();
    // SIMPLIFICAÇÃO: Único estado para os horários selecionados no dia
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

    const initialState = { message: null, errors: null, success: false };
    const [state, formAction] = useActionState(updateDoctorAvailabilityAction, initialState);

    // Efeito para popular os horários selecionados quando a data ou a disponibilidade inicial mudam
    useEffect(() => {
        if (selectedDate) {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            const timesForDay = initialAvailability
                .filter(slot => slot.date === formattedDate)
                .map(slot => slot.time);
            setSelectedTimes(timesForDay);
        } else {
            setSelectedTimes([]); // Limpa a seleção se nenhuma data for escolhida
        }
    }, [selectedDate, initialAvailability]);

    // Efeito para mostrar toasts de sucesso ou erro após a ação do servidor
    useEffect(() => {
        if (state.success) {
            toast({
                title: 'Sucesso!',
                description: state.message,
                className: "bg-green-100 text-green-800 border-green-200",
            });
        } else if (state.message) {
            toast({
                variant: "destructive",
                title: 'Erro ao Salvar',
                description: state.message,
            });
        }
    }, [state, toast]);

    const formattedSelectedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

    return (
        <div className="animate-in fade-in duration-300">
            {formattedSelectedDate ? (
                <form action={formAction}>
                    <input type="hidden" name="date" value={formattedSelectedDate} />
                    <input type="hidden" name="times" value={JSON.stringify(selectedTimes)} />

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Períodos de Atendimento</h3>
                        </div>

                        <ToggleGroup
                            type="multiple"
                            value={selectedTimes}
                            onValueChange={setSelectedTimes}
                            className="flex flex-wrap gap-2 justify-start"
                        >
                            {ALL_DAY_TIMES.map(time => (
                                <ToggleGroupItem
                                    key={time}
                                    value={time}
                                    aria-label={`Select time ${time}`}
                                    className="h-10 min-w-[80px] rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 hover:text-blue-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-600 data-[state=on]:shadow-sm transition-all"
                                >
                                    {time}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>

                        <div className="pt-2">
                            <SubmitButton />
                        </div>
                    </div>
                </form>
            ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mb-2 opacity-50" />
                    <p className="text-sm font-bold text-slate-500">Nenhuma data selecionada</p>
                    <p className="text-xs text-slate-400">Selecione uma data no calendário acima.</p>
                </div>
            )}
        </div>
    );
}
