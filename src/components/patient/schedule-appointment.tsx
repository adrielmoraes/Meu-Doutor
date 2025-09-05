
'use client';

import { useState, useEffect, useActionState } from 'react'; // Importar useActionState
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { Doctor } from '@/types';
// Importar as Server Actions reais
import { getAvailableTimesAction, scheduleAppointmentAction } from '@/app/patient/doctors/actions'; 
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { format, isSameDay, parseISO } from 'date-fns'; // Importar isSameDay e parseISO
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type AvailabilitySlot = { date: string; time: string; available: boolean };

type ScheduleAppointmentProps = {
  doctor: Doctor;
  patientId: string;
  doctorAvailability: { date: string; time: string; available: boolean }[]; // Adicionado aqui
};

export default function ScheduleAppointment({ doctor, patientId, doctorAvailability }: ScheduleAppointmentProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isFetchingTimes, setIsFetchingTimes] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Inicializar useActionState com a Server Action real
  const initialState = { message: null, errors: {}, success: false };
  const [state, formAction] = useActionState(scheduleAppointmentAction, initialState);

  // Destaque os dias com disponibilidade no calendário
  const availableDays = doctorAvailability
    .filter(slot => slot.available) // Apenas slots disponíveis
    .map(slot => parseISO(slot.date)); // Converter string para Date para o Calendar

  const modifiers = {
    available: availableDays, // Dias com disponibilidade
  };

  const modifiersClassNames = {
    available: 'bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary', // Estilo para dias disponíveis
  };

  // Função para buscar horários disponíveis
  const fetchAvailableTimes = async (selectedDate: Date) => {
    setIsFetchingTimes(true);
    setSelectedTime(null); // Reset selected time when date changes
    try {
        // A Server Action getAvailableTimesAction agora usa o admin-adapter
        const times = await getAvailableTimesAction(doctor.id, selectedDate);
        setAvailableTimes(times);
    } catch (error) {
        console.error("Failed to fetch times", error);
        setAvailableTimes([]);
        toast({
            variant: 'destructive',
            title: 'Erro ao Buscar Horários',
            description: 'Não foi possível carregar os horários disponíveis. Tente novamente.',
        });
    } finally {
        setIsFetchingTimes(false);
    }
  };

  // Fetch times when the dialog is opened or the date changes
  useEffect(() => {
    if (isOpen && date) {
      fetchAvailableTimes(date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, date]);

  // Lidar com o resultado da Server Action scheduleAppointmentAction
  useEffect(() => {
    if (state.success) {
        toast({
            title: 'Sucesso!',
            description: state.message,
            className: 'bg-green-100 text-green-800 border-green-200'
        });
        setIsOpen(false); // Fechar o diálogo no sucesso
        // Opcional: Revalidar o path da agenda do paciente ou médico se necessário
        // router.refresh();
    } else if (state.message) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Agendar',
            description: state.message,
        });
    }
  }, [state, toast, setIsOpen]);

  // Funçao para submeter o formulario manualmente com os dados
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Previne o submit padrão do formulário
    if (!date || !selectedTime) {
        toast({
            variant: 'destructive',
            title: 'Seleção Incompleta',
            description: 'Por favor, selecione uma data e um horário.',
        });
        return;
    }

    const formData = new FormData(event.currentTarget); // Cria um FormData a partir do form
    formData.set('doctorId', doctor.id);
    formData.set('patientId', patientId);
    formData.set('date', format(date, 'yyyy-MM-dd'));
    formData.set('time', selectedTime);
    formData.set('type', 'Consulta Online (Vídeo)'); // Tipo de consulta padrão ou selecionável

    formAction(formData); // Chama a Server Action
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <CalendarIcon className="mr-2 h-4 w-4" /> Agendar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar consulta com {doctor.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}> {/* Usar o onSubmit personalizado */}
            <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">Selecione uma data para ver os horários disponíveis.</p>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
                modifiers={modifiers} // Adicionar modificadores
                modifiersClassNames={modifiersClassNames} // Adicionar classes de modificadores
              />

              {date && (
                <div className='min-h-[80px]'>
                    <h4 className="font-semibold mb-2 flex items-center justify-between">
                        <span>Horários para {format(date, 'dd/MM/yyyy')}:</span>
                         <Button variant="ghost" size="icon" onClick={() => fetchAvailableTimes(date)} disabled={isFetchingTimes}>
                            <RefreshCw className={`h-4 w-4 ${isFetchingTimes ? 'animate-spin' : ''}`} />
                        </Button>
                    </h4>
                    {isFetchingTimes ? (
                        <div className="flex items-center justify-center h-16">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : availableTimes.length > 0 ? (
                         <ToggleGroup type="single" onValueChange={setSelectedTime} variant="outline" className="flex-wrap justify-start">
                            {availableTimes.map(time => (
                                <ToggleGroupItem key={time} value={time} aria-label={`Select time ${time}`}>
                                    {time}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    ) : (
                        <Alert>
                            <AlertTitle>Nenhum horário disponível</AlertTitle>
                            <AlertDescription>
                                Não há horários livres para esta data. Por favor, selecione outro dia.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={state.pending || !date || !selectedTime}>
                {state.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Agendamento
              </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
