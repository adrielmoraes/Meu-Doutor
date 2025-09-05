
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ManageAvailability from '@/components/doctor/manage-availability';
import type { Appointment, Doctor } from "@/types";
import { isSameDay, format, parseISO } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ScheduleCalendarManagerProps = {
    appointments: Appointment[];
    doctor: Doctor;
};

export default function ScheduleCalendarManager({ appointments, doctor }: ScheduleCalendarManagerProps) {
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());

    const formattedSelectedCalendarDate = selectedCalendarDate ? format(selectedCalendarDate, 'yyyy-MM-dd') : null;

    // Filtra agendamentos para a data selecionada no calendário
    const appointmentsForSelectedDate = Array.isArray(appointments) 
        ? appointments.filter(appt => 
            formattedSelectedCalendarDate && appt.date === formattedSelectedCalendarDate
          )
        : [];

    // Destaque os dias com disponibilidade no calendário (para o médico ver)
    const availableDays = doctor.availability
        .filter(slot => slot.available) // Apenas slots disponíveis
        .map(slot => parseISO(slot.date));

    // Destaque os dias com agendamentos no calendário
    const bookedDays = appointments
        .map(appt => parseISO(appt.date));

    const modifiers = {
        available: availableDays,
        booked: bookedDays,
    };

    const modifiersClassNames = {
        available: 'bg-green-500 text-green-50', // Cor para dias com disponibilidade
        booked: 'bg-primary/50 text-primary-foreground', // Cor para dias com agendamentos
    };

    const renderAppointmentList = (apts: Appointment[]) => (
        <ul className="space-y-4">
            {apts.length > 0 ? (
                apts.map(appt => (
                    <Card key={appt.id} className="p-4 flex items-center gap-4 transition-all hover:shadow-md">
                        <Avatar>
                            <AvatarImage src={appt.patientAvatar} />
                            <AvatarFallback>{appt.patientName.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <p className="font-semibold text-lg">{appt.time} - {appt.patientName}</p>
                            <p className="text-sm text-muted-foreground">{appt.type}</p>
                        </div>
                        <Button size="icon" variant="ghost">
                            <Video className="h-5 w-5 text-primary" />
                        </Button>
                    </Card>
                ))
            ) : (
                <li className="text-center text-muted-foreground py-4">
                    Nenhuma consulta encontrada para esta data.
                </li>
            )}
        </ul>
    );

    return (
        <div className="grid md:grid-cols-3 gap-8">
            {/* Coluna do Calendário */}
            <div className="md:col-span-2">
                <Card>
                    <CardContent className="p-0 md:p-4">
                        <Calendar
                            mode="single"
                            selected={selectedCalendarDate}
                            onSelect={setSelectedCalendarDate}
                            className="rounded-md border w-full max-w-full md:max-w-none"
                            disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() -1))} 
                            modifiers={modifiers}
                            modifiersClassNames={modifiersClassNames}
                        />
                    </CardContent>
                </Card>
            </div>
            
            {/* Painel Lateral: Agendamentos do Dia Selecionado e Gerenciar Disponibilidade */}
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Consultas para {formattedSelectedCalendarDate ? format(selectedCalendarDate, 'dd/MM/yyyy') : 'Data Selecionada'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderAppointmentList(appointmentsForSelectedDate)}
                    </CardContent>
                </Card>

                <div className="mt-8">
                    <ManageAvailability 
                        doctorId={doctor.id} 
                        initialAvailability={doctor.availability || []} 
                        selectedDate={selectedCalendarDate}
                    />
                </div>
            </div>
        </div>
    );
}
