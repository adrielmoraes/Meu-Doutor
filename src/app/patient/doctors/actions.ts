'use server';

import { getAppointmentsByDate } from "@/lib/firestore-adapter";
import { format } from "date-fns";

// Defines a standard work day for doctors
const allPossibleTimes = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

/**
 * Calculates available appointment times for a given date by checking existing appointments.
 * @param doctorId The ID of the doctor.
 * @param date The selected date.
 * @returns A list of available time slots.
 */
export async function getAvailableTimesAction(doctorId: string, date: Date): Promise<string[]> {
    try {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const existingAppointments = await getAppointmentsByDate(doctorId, formattedDate);

        const bookedTimes = new Set(existingAppointments.map(appt => appt.time));

        const availableTimes = allPossibleTimes.filter(time => !bookedTimes.has(time));

        return availableTimes;

    } catch (error) {
        console.error("Error fetching available times:", error);
        // In case of an error, return no available times to be safe.
        return [];
    }
}
