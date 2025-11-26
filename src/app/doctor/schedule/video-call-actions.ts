'use server';

import { getSession } from '@/lib/session';
import { createCallRoom, getDoctorById, updateCallRoomStatus } from '@/lib/db-adapter';
import { notificationManager } from '@/lib/notifications-sse';
import { db } from '../../../../server/storage';
import { callRooms } from '../../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export async function startVideoCallAction(patientId: string, appointmentId: string) {
  const session = await getSession();
  
  if (!session || session.role !== 'doctor') {
    throw new Error('Não autorizado');
  }

  const doctorId = session.userId;
  const roomName = `doctor-call-${appointmentId}-${Date.now()}`;
  
  try {
    // Create call room in database so patient can see the incoming call
    await createCallRoom(roomName, patientId, doctorId, 'video');
    
    // Get doctor info to send notification
    const doctor = await getDoctorById(doctorId);
    
    // Send SSE notification to patient
    if (doctor) {
      await notificationManager.sendToUser(patientId, {
        id: roomName,
        type: 'alert',
        title: 'Chamada de Vídeo',
        message: `Dr(a). ${doctor.name} está chamando você`,
        timestamp: new Date(),
        data: {
          type: 'incoming_call',
          roomName,
          doctorId,
          doctorName: doctor.name,
          doctorSpecialty: doctor.specialty,
          doctorAvatar: doctor.avatar,
          appointmentId
        }
      });
    }
    
    return {
      success: true,
      roomName,
      redirectUrl: `/doctor/video-call?patientId=${patientId}&roomName=${roomName}&appointmentId=${appointmentId}`
    };
  } catch (error) {
    console.error('Erro ao criar sala de chamada:', error);
    throw new Error('Não foi possível iniciar a chamada');
  }
}

export async function endVideoCallAction(roomName: string) {
  const session = await getSession();
  
  if (!session || session.role !== 'doctor') {
    throw new Error('Não autorizado');
  }

  try {
    // Verify that this call room belongs to this doctor
    const room = await db
      .select()
      .from(callRooms)
      .where(
        and(
          eq(callRooms.id, roomName),
          eq(callRooms.doctorId, session.userId)
        )
      )
      .limit(1);

    if (!room.length) {
      throw new Error('Chamada não encontrada ou não autorizada');
    }

    await updateCallRoomStatus(roomName, 'ended');
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao encerrar chamada:', error);
    return { success: false };
  }
}
