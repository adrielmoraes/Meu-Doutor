
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { Doctor } from '@/types';
import { createAppointmentAction } from './actions';
import { getPatientById } from '@/lib/firestore-adapter';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { format } from 'date-fns';
import { getAvailableTimesAction } from '@/app/patient/doctors/actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

// This should be replaced with the authenticated user's ID
const MOCK_PATIENT_ID = '1';


type ScheduleAppointmentProps = {
  doctor: Doctor;
};

export default function ScheduleAppointment({ doctor }: ScheduleAppointmentProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTimes, setIsFetchingTimes] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchAvailableTimes = async (selectedDate: Date) => {
    setIsFetchingTimes(true);
    setSelectedTime(null); // Reset selected time when date changes
    try {
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
  }, [isOpen, date]);


  const handleBooking = async () => {
    if (!date || !selectedTime) {
      toast({
        variant: 'destructive',
        title: 'Seleção Incompleta',
        description: 'Por favor, selecione uma data e um horário.',
      });
      return;
    }

    setIsLoading(true);
    
    try {
        const patient = await getPatientById(MOCK_PATIENT_ID);
        if (!patient) {
            throw new Error("Paciente não encontrado.");
        }

        const result = await createAppointmentAction({
            patientId: MOCK_PATIENT_ID,
            patientName: patient.name,
            patientAvatar: patient.avatar,
            doctorId: doctor.id,
            date: format(date, 'yyyy-MM-dd'),
            time: selectedTime,
            type: 'Consulta de Rotina',
            status: 'Agendada',
        });

        if (result.success) {
            toast({
                title: 'Sucesso!',
                description: result.message,
                className: 'bg-green-100 text-green-800 border-green-200'
            });
            setIsOpen(false); // Close the dialog on success
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        toast({
            variant: 'destructive',
            title: 'Erro ao Agendar',
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
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
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">Selecione uma data para ver os horários disponíveis.</p>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
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
             <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleBooking} disabled={isLoading || !date || !selectedTime}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
