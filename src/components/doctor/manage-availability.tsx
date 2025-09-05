
'use client';

import { useState, useEffect, useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// REMOVER: import { Calendar } from '@/components/ui/calendar';
// REMOVER: Select, SelectContent, SelectItem, SelectTrigger, SelectValue
import { Loader2, PlusCircle, MinusCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { updateDoctorAvailabilityAction } from '@/app/doctor/profile/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'; // Importar ToggleGroup

type AvailabilitySlot = { date: string; time: string; available: boolean };

type ManageAvailabilityProps = {
    doctorId: string;
    initialAvailability: AvailabilitySlot[];
    selectedDate: Date | undefined; // NOVO: Receber a data selecionada como prop
};

const allDayTimes = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

export default function ManageAvailability({ doctorId, initialAvailability, selectedDate }: ManageAvailabilityProps) {
    const { toast } = useToast();
    const [availability, setAvailability] = useState<AvailabilitySlot[]>(initialAvailability);
    // REMOVER: const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    // Mudar para um array para seleção múltipla de horários
    const [selectedTimesToAdd, setSelectedTimesToAdd] = useState<string[]>([]); 

    // Estado para a Server Action
    const initialState = { message: null, errors: null, success: false };
    const [state, formAction] = useActionState(updateDoctorAvailabilityAction, initialState);

    // Atualizar estado local se a prop inicial mudar (ex: revalidação da página)
    useEffect(() => {
        setAvailability(initialAvailability);
    }, [initialAvailability]);

    // Lidar com o resultado da Server Action
    useEffect(() => {
        if (state.success) {
            toast({
                title: 'Sucesso!',
                description: state.message,
                className: "bg-green-100 text-green-800 border-green-200",
            });
            // Após salvar com sucesso, limpar a seleção de horários para adicionar
            setSelectedTimesToAdd([]); 
        } else if (state.message) {
            toast({
                variant: "destructive",
                title: 'Erro',
                description: state.message,
            });
        }
    }, [state, toast]);

    const formattedSelectedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

    const handleAddSlots = () => {
        if (!formattedSelectedDate || selectedTimesToAdd.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Seleção Incompleta',
                description: 'Por favor, selecione ao menos um horário para adicionar.',
            });
            return;
        }

        const newSlots: AvailabilitySlot[] = selectedTimesToAdd.map(time => ({
            date: formattedSelectedDate,
            time: time,
            available: true
        }));

        let currentAvailability = [...availability];
        let addedCount = 0;

        newSlots.forEach(newSlot => {
            // Evitar duplicatas
            if (!currentAvailability.some(slot => slot.date === newSlot.date && slot.time === newSlot.time)) {
                currentAvailability.push(newSlot);
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            setAvailability(currentAvailability.sort((a, b) => {
                const dateTimeA = `${a.date} ${a.time}`;
                const dateTimeB = `${b.date} ${b.time}`;
                return dateTimeA.localeCompare(dateTimeB);
            }));
        }
        
        setSelectedTimesToAdd([]); // Resetar seleção de horas

        if (addedCount === 0 && newSlots.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Horários Existentes',
                description: 'Todos os horários selecionados já foram adicionados para esta data.',
            });
        } else if (addedCount > 0) {
             toast({
                title: 'Horários Adicionados!',
                description: `${addedCount} horári${addedCount > 1 ? 'os' : 'o'} adicionado${addedCount > 1 ? 's' : ''} com sucesso localmente. Clique em Salvar Disponibilidade para aplicar. `,
                className: "bg-green-100 text-green-800 border-green-200",
            });
        }
    };

    const handleRemoveSlot = (slotToRemove: AvailabilitySlot) => {
        setAvailability(prev => prev.filter(slot => 
            !(slot.date === slotToRemove.date && slot.time === slotToRemove.time)
        ));
    };

    const handleSaveAvailability = () => {
        const formData = new FormData();
        formData.append('doctorId', doctorId);
        formData.append('availability', JSON.stringify(availability));
        formAction(formData);
    };

    // Filtra slots para a data selecionada (agora recebida via prop)
    const slotsForSelectedDate = availability.filter(slot => slot.date === formattedSelectedDate);
    const availableTimesInDayForSelection = allDayTimes.filter(time => 
        !slotsForSelectedDate.some(slot => slot.time === time)
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerenciar Disponibilidade</CardTitle>
                <CardDescription>Defina os horários em que você está disponível para consultas em {formattedSelectedDate ? format(selectedDate!, 'dd/MM/yyyy') : 'nenhuma data selecionada'}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {formattedSelectedDate ? (
                    <div className="space-y-4">
                        <h3 className="font-semibold">Horários Disponíveis para Adicionar:</h3>
                        {availableTimesInDayForSelection.length > 0 ? (
                            <ToggleGroup 
                                type="multiple" 
                                onValueChange={setSelectedTimesToAdd}
                                value={selectedTimesToAdd}
                                className="flex-wrap justify-start"
                            >
                                {availableTimesInDayForSelection.map(time => (
                                    <ToggleGroupItem key={time} value={time} aria-label={`Select time ${time}`}>
                                        {time}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        ) : (
                            <Alert variant="default">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Todos os horários ocupados</AlertTitle>
                                <AlertDescription>Não há mais horários disponíveis para adicionar nesta data.</AlertDescription>
                            </Alert>
                        )}
                         <Button onClick={handleAddSlots} disabled={selectedTimesToAdd.length === 0} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Selecionados</Button>
                    
                         {slotsForSelectedDate.length > 0 && (
                            <div className="mt-4 p-3 bg-muted rounded-md border">
                                <h4 className="text-sm font-medium mb-2">Horários nesta data (definidos):</h4>
                                <div className="flex flex-wrap gap-2">
                                    {slotsForSelectedDate.map(slot => (
                                        <Badge key={`${slot.date}-${slot.time}`} variant="secondary" className="flex items-center gap-1.5 pr-1">
                                            {slot.time} {slot.available ? '' : '(Agendado)'}
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveSlot(slot)}>
                                                <MinusCircle className="h-3 w-3 text-destructive" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Alert variant="default">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Selecione uma data</AlertTitle>
                        <AlertDescription>Por favor, selecione uma data no calendário principal para gerenciar a disponibilidade.</AlertDescription>
                    </Alert>
                )}
               
                {/* Botão Salvar */}
                <Button onClick={handleSaveAvailability} disabled={state.pending} className="w-full mt-6">
                    {state.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Salvar Disponibilidade
                </Button>

                {state.message && !state.success && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erro ao Salvar</AlertTitle>
                        <AlertDescription>{state.message}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
