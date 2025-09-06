
'use client';

import { useState, useEffect, useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
// CORREÇÃO: Importar a ação do novo local correto
import { updateDoctorAvailabilityAction } from '@/app/doctor/schedule/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
        <Card>
            <CardHeader>
                <CardTitle>Gerenciar Disponibilidade</CardTitle>
                <CardDescription>
                    {formattedSelectedDate 
                        ? `Defina seus horários para ${format(selectedDate!, 'dd/MM/yyyy')}.`
                        : 'Selecione uma data no calendário para começar.'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {formattedSelectedDate ? (
                    // SIMPLIFICAÇÃO: Usar um formulário que chama a Server Action diretamente
                    <form action={formAction}>
                        <input type="hidden" name="date" value={formattedSelectedDate} />
                        <input type="hidden" name="times" value={JSON.stringify(selectedTimes)} />

                        <div className="space-y-4">
                            <h3 className="font-semibold">Selecione os horários disponíveis:</h3>
                            <ToggleGroup
                                type="multiple"
                                value={selectedTimes}
                                onValueChange={setSelectedTimes} // Atualiza o estado diretamente
                                className="flex-wrap justify-start"
                            >
                                {ALL_DAY_TIMES.map(time => (
                                    <ToggleGroupItem key={time} value={time} aria-label={`Select time ${time}`}>
                                        {time}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>

                            <Button type="submit" disabled={state.pending} className="w-full mt-4">
                                {state.pending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                Salvar Disponibilidade
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Alert variant="default">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Nenhuma data selecionada</AlertTitle>
                        <AlertDescription>Selecione uma data no calendário ao lado para definir seus horários.</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
