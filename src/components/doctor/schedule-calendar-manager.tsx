'use client';

import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CalendarDays, Clock, User, Video, Phone, MapPin, 
  ChevronRight, Calendar as CalendarIcon, Users
} from "lucide-react";
import ManageAvailability from '@/components/doctor/manage-availability';
import StartVideoCallButton from '@/components/doctor/start-video-call-button';
import CancelAppointmentButton from '@/components/ui/cancel-appointment-button';
import type { Appointment, Doctor } from "@/types";
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

type ScheduleCalendarManagerProps = {
    appointments: Appointment[];
    doctor: Doctor;
};

export default function ScheduleCalendarManager({ appointments, doctor }: ScheduleCalendarManagerProps) {
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());

    const formattedSelectedCalendarDate = selectedCalendarDate ? format(selectedCalendarDate, 'yyyy-MM-dd') : null;

    const appointmentsForSelectedDate = Array.isArray(appointments) 
        ? appointments.filter(appt => 
            formattedSelectedCalendarDate && appt.date === formattedSelectedCalendarDate
          ).sort((a, b) => a.time.localeCompare(b.time))
        : [];

    const availableDays = doctor.availability
        ? doctor.availability
            .filter(slot => slot.available)
            .map(slot => parseISO(slot.date))
        : [];

    const bookedDays = appointments.map(appt => parseISO(appt.date));

    const modifiers = {
        available: availableDays,
        booked: bookedDays,
    };

    const modifiersClassNames = {
        available: 'bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/40',
        booked: 'bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/40',
    };

    const getAppointmentTypeIcon = (type: string) => {
        if (type.toLowerCase().includes('vídeo') || type.toLowerCase().includes('online')) {
            return <Video className="h-4 w-4 text-cyan-400" />;
        }
        if (type.toLowerCase().includes('telefone')) {
            return <Phone className="h-4 w-4 text-purple-400" />;
        }
        return <MapPin className="h-4 w-4 text-amber-400" />;
    };

    const getDateLabel = (date: Date | undefined) => {
        if (!date) return 'Selecione uma data';
        if (isToday(date)) return 'Hoje';
        if (isTomorrow(date)) return 'Amanhã';
        return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
    };

    const upcomingAppointments = appointments
        .filter(appt => new Date(appt.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-6">
                    <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-cyan-500/20 overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-cyan-300">
                                    <CalendarIcon className="h-5 w-5" />
                                    Calendário
                                </CardTitle>
                                <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-xs">
                                    {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-4">
                            <Calendar
                                mode="single"
                                selected={selectedCalendarDate}
                                onSelect={setSelectedCalendarDate}
                                className="rounded-lg w-full [&_.rdp-day]:h-10 [&_.rdp-day]:w-10"
                                disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() - 1))} 
                                modifiers={modifiers}
                                modifiersClassNames={modifiersClassNames}
                            />
                            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                                    <span className="text-xs text-slate-400">Disponível</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-cyan-500/50"></div>
                                    <span className="text-xs text-slate-400">Agendado</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-purple-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-purple-300 text-lg">
                                <Users className="h-5 w-5" />
                                Próximas Consultas
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Seus próximos {upcomingAppointments.length} agendamentos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcomingAppointments.length > 0 ? (
                                <div className="space-y-2">
                                    {upcomingAppointments.map((appt) => (
                                        <div 
                                            key={appt.id}
                                            className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedCalendarDate(parseISO(appt.date))}
                                        >
                                            <div className="flex-shrink-0 w-12 text-center">
                                                <div className="text-xs text-slate-400">
                                                    {format(parseISO(appt.date), 'dd/MM')}
                                                </div>
                                                <div className="text-sm font-semibold text-white">
                                                    {appt.time.split('-')[0]}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {appt.patientName}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                                    {getAppointmentTypeIcon(appt.type)}
                                                    <span className="truncate">{appt.type}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-500" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-400">
                                    <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Nenhuma consulta agendada</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-cyan-500/20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-cyan-300 capitalize">
                                        {getDateLabel(selectedCalendarDate)}
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        {selectedCalendarDate && format(selectedCalendarDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </CardDescription>
                                </div>
                                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                                    {appointmentsForSelectedDate.length} consulta{appointmentsForSelectedDate.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {appointmentsForSelectedDate.length > 0 ? (
                                <ScrollArea className="h-[280px] pr-4">
                                    <div className="space-y-3">
                                        {appointmentsForSelectedDate.map(appt => (
                                            <div 
                                                key={appt.id} 
                                                className="group flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-all"
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="text-center px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                                        <div className="text-lg font-bold text-cyan-300">
                                                            {appt.time.split('-')[0] || appt.time}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <Avatar className="h-12 w-12 border-2 border-slate-600">
                                                    <AvatarImage src={appt.patientAvatar} />
                                                    <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-blue-600 text-white">
                                                        {appt.patientName.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-white truncate">
                                                            {appt.patientName}
                                                        </p>
                                                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 hidden sm:inline-flex">
                                                            {appt.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {getAppointmentTypeIcon(appt.type)}
                                                        <span className="text-sm text-slate-400 truncate">{appt.type}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {appt.status === 'Agendada' && appt.type.includes('Vídeo') && (
                                                        <StartVideoCallButton 
                                                            patientId={appt.patientId}
                                                            appointmentId={appt.id}
                                                            patientName={appt.patientName}
                                                        />
                                                    )}
                                                    <CancelAppointmentButton appointment={appt} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
                                        <CalendarDays className="h-8 w-8 text-slate-500" />
                                    </div>
                                    <p className="text-slate-400 mb-1">Nenhuma consulta agendada</p>
                                    <p className="text-sm text-slate-500">
                                        Selecione outra data ou configure sua disponibilidade
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-emerald-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-300">
                                <Clock className="h-5 w-5" />
                                Gerenciar Disponibilidade
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Defina seus horários para {selectedCalendarDate ? format(selectedCalendarDate, 'dd/MM/yyyy') : 'a data selecionada'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ManageAvailability 
                                initialAvailability={doctor.availability || []} 
                                selectedDate={selectedCalendarDate}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
