
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cancelAppointmentAction } from '@/app/api/appointments/actions';
import type { Appointment } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect } from 'react';

type CancelAppointmentButtonProps = {
  appointment: Appointment;
};

export default function CancelAppointmentButton({ appointment }: CancelAppointmentButtonProps) {
  const { toast } = useToast();
  const initialState = { message: null, success: false };
  const [state, formAction] = useActionState(cancelAppointmentAction, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Sucesso!',
          description: state.message,
          className: "bg-green-100 text-green-800 border-green-200",
        });
      } else {
        toast({
          variant: "destructive",
          title: 'Erro',
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
          <XCircle className="h-5 w-5" />
          <span className="sr-only">Cancelar Consulta</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction}>
          <input type="hidden" name="appointmentId" value={appointment.id} />
          <input type="hidden" name="doctorId" value={appointment.doctorId} />
          <input type="hidden" name="date" value={appointment.date} />
          <input type="hidden" name="time" value={appointment.time} />

          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja cancelar a consulta com {appointment.doctorName || appointment.patientName} em {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction asChild>
                <Button type="submit" variant="destructive" disabled={state.pending}>
                  {state.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Cancelamento
                </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
