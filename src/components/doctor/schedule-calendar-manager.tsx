'use client';

import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-8">
                    {/* Calendar Card */}
                    <Card className="bg-white border-none ring-1 ring-slate-200 shadow-sm overflow-hidden rounded-2xl">
                        <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                                    Calendário de Consultas
                                </CardTitle>
                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-tight">
                                    {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 lg:p-8">
                            <Calendar
                                mode="single"
                                selected={selectedCalendarDate}
                                onSelect={setSelectedCalendarDate}
                                className="w-full"
                                classNames={{
                                    month: "space-y-6 w-full",
                                    caption: "flex justify-center pt-1 relative items-center mb-6",
                                    caption_label: "text-xl font-extrabold text-slate-900",
                                    nav: "space-x-2 flex items-center",
                                    nav_button: "h-9 w-9 bg-slate-50 p-0 opacity-100 hover:bg-blue-600 hover:text-white rounded-full text-slate-600 transition-all border border-slate-200",
                                    nav_button_previous: "absolute left-1",
                                    nav_button_next: "absolute right-1",
                                    table: "w-full border-collapse",
                                    head_row: "flex w-full justify-between mb-4",
                                    head_cell: "text-slate-400 rounded-md w-11 font-bold text-xs uppercase tracking-widest text-center",
                                    row: "flex w-full mt-2 justify-between",
                                    cell: "h-11 w-11 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
                                    day: "h-11 w-11 p-0 font-bold text-slate-600 aria-selected:opacity-100 hover:bg-blue-50 hover:text-blue-700 rounded-full transition-all duration-200",
                                    day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white shadow-md shadow-blue-200",
                                    day_today: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
                                    day_outside: "text-slate-300 opacity-40",
                                    day_disabled: "text-slate-200 opacity-30",
                                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                    day_hidden: "invisible",
                                }}
                                disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() - 1))}
                                modifiers={modifiers}
                                modifiersClassNames={{
                                    available: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 font-extrabold',
                                    booked: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 font-extrabold',
                                }}
                            />

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-100 ring-1 ring-emerald-300"></div>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">Disponível</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-100 ring-1 ring-blue-300"></div>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">Agendado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-white border-2 border-blue-600"></div>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">Selecionado</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats for Upcoming */}
                    <Card className="bg-white border-none ring-1 ring-slate-200 shadow-sm overflow-hidden rounded-2xl">
                        <CardHeader className="pb-3 border-b border-slate-50">
                            <CardTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
                                <Users className="h-5 w-5 text-indigo-600" />
                                Próximas Consultas
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium">
                                Seus próximos {upcomingAppointments.length} agendamentos na plataforma
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {upcomingAppointments.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingAppointments.map((appt) => (
                                        <div
                                            key={appt.id}
                                            className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                                            onClick={() => setSelectedCalendarDate(parseISO(appt.date))}
                                        >
                                            <div className="flex-shrink-0 w-14 text-center py-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-blue-200 shadow-sm">
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter leading-none mb-1">
                                                    {format(parseISO(appt.date), 'MMM', { locale: ptBR })}
                                                </div>
                                                <div className="text-lg font-extrabold text-slate-900 leading-none">
                                                    {format(parseISO(appt.date), 'dd')}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                    {appt.patientName}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs font-bold text-blue-600">
                                                        {appt.time.split('-')[0]}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                                        {getAppointmentTypeIcon(appt.type)}
                                                        <span className="truncate">{appt.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CalendarDays className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-bold">Nenhuma consulta agendada</p>
                                    <p className="text-sm text-slate-400 mt-1">Sua agenda está livre por enquanto.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Manage Availability - Secondary Area */}
                    <Card className="bg-white border-none ring-1 ring-slate-200 shadow-sm overflow-hidden rounded-2xl">
                        <CardHeader className="pb-3 border-b border-slate-50">
                            <CardTitle className="flex items-center gap-2 text-slate-900 font-bold">
                                <Clock className="h-5 w-5 text-emerald-600" />
                                Horários de Atendimento
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium">
                                Configure sua disponibilidade para {selectedCalendarDate ? format(selectedCalendarDate, 'dd/MM/yyyy') : 'o dia selecionado'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ManageAvailability
                                initialAvailability={doctor.availability || []}
                                selectedDate={selectedCalendarDate}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Day Details Area */}
                <div className="lg:col-span-7 space-y-8">
                    <Card className="bg-white border-none ring-1 ring-slate-200 shadow-sm overflow-hidden rounded-2xl h-full flex flex-col">
                        <CardHeader className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block mb-1">
                                        Detalhamento do Dia
                                    </span>
                                    <CardTitle className="text-4xl font-extrabold text-slate-900 tracking-tight capitalize">
                                        {getDateLabel(selectedCalendarDate)}
                                    </CardTitle>
                                    <CardDescription className="text-lg text-slate-500 font-medium mt-1">
                                        {selectedCalendarDate && format(selectedCalendarDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Diário</span>
                                        <Badge className="bg-blue-600 text-white border-none px-4 py-1.5 rounded-full font-bold shadow-sm shadow-blue-100">
                                            {appointmentsForSelectedDate.length} {appointmentsForSelectedDate.length === 1 ? 'Consulta' : 'Consultas'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            {appointmentsForSelectedDate.length > 0 ? (
                                <ScrollArea className="h-full min-h-[500px] p-6 md:p-8">
                                    <div className="space-y-6">
                                        {appointmentsForSelectedDate.map(appt => (
                                            <div
                                                key={appt.id}
                                                className="group flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/50 transition-all duration-300"
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="text-center w-24 py-3 rounded-2xl bg-blue-50 border border-blue-100 group-hover:bg-blue-600 transition-colors">
                                                        <div className="text-xl font-extrabold text-blue-700 group-hover:text-white">
                                                            {appt.time.split('-')[0] || appt.time}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter group-hover:text-blue-100">
                                                            Check-in
                                                        </div>
                                                    </div>
                                                </div>

                                                <Avatar className="h-16 w-16 ring-4 ring-white shadow-sm shrink-0">
                                                    <AvatarImage src={appt.patientAvatar} />
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold text-lg">
                                                        {appt.patientName.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                                        <p className="text-xl font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                                            {appt.patientName}
                                                        </p>
                                                        <Badge variant="outline" className="text-[10px] h-6 px-3 bg-slate-50 border-slate-200 text-slate-600 font-bold uppercase tracking-tight">
                                                            {appt.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium whitespace-nowrap overflow-hidden">
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {getAppointmentTypeIcon(appt.type)}
                                                            <span>{appt.type}</span>
                                                        </div>
                                                        <span className="text-slate-200 hidden md:inline">|</span>
                                                        <div className="hidden md:flex items-center gap-1.5 shrink-0">
                                                            <User className="h-4 w-4 text-slate-400" />
                                                            <span>ID: {appt.patientId.substring(0, 8)}...</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 md:pl-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0">
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
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 ring-8 ring-slate-50/50">
                                        <CalendarDays className="h-12 w-12 text-slate-300" />
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Pausa na Agenda</h3>
                                    <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                                        Não há consultas registradas para esta data. Que tal revisar suas notas ou configurar novos horários?
                                    </p>
                                    <Button asChild variant="outline" className="mt-8 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold shadow-sm shadow-blue-50">
                                        <Link href="/doctor/patients">Ver Meus Pacientes</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                Dr.IA • Protocolo Médico Digital
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
