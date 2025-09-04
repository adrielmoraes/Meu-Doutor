import { getAdminDb } from './firebase-admin';
import SimplePeer from 'simple-peer';

export interface CallRoom {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'waiting' | 'active' | 'ended';
  createdAt: string;
  endedAt?: string;
}

export interface CallSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  from: string;
  to: string;
  timestamp: string;
}

export class WebRTCService {
  private db = getAdminDb();

  async createCallRoom(patientId: string, doctorId: string): Promise<string> {
    const roomId = this.generateRoomId();
    const room: CallRoom = {
      id: roomId,
      patientId,
      doctorId,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    await this.db.collection('callRooms').doc(roomId).set(room);
    return roomId;
  }

  async getCallRoom(roomId: string): Promise<CallRoom | null> {
    const doc = await this.db.collection('callRooms').doc(roomId).get();
    return doc.exists ? (doc.data() as CallRoom) : null;
  }

  async updateCallStatus(roomId: string, status: CallRoom['status']): Promise<void> {
    const updateData: Partial<CallRoom> = { status };
    if (status === 'ended') {
      updateData.endedAt = new Date().toISOString();
    }
    
    await this.db.collection('callRooms').doc(roomId).update(updateData);
  }

  async sendSignal(roomId: string, signal: Omit<CallSignal, 'timestamp'>): Promise<void> {
    const fullSignal: CallSignal = {
      ...signal,
      timestamp: new Date().toISOString(),
    };

    await this.db
      .collection('callRooms')
      .doc(roomId)
      .collection('signals')
      .add(fullSignal);
  }

  async listenForSignals(
    roomId: string,
    userId: string,
    callback: (signal: CallSignal) => void
  ): () => void {
    // Esta função seria usada no cliente com Firebase Client SDK
    // Por enquanto, retornamos uma função vazia para compatibilidade
    return () => {};
  }

  async getActiveCallsForDoctor(doctorId: string): Promise<CallRoom[]> {
    const snapshot = await this.db
      .collection('callRooms')
      .where('doctorId', '==', doctorId)
      .where('status', 'in', ['waiting', 'active'])
      .get();

    return snapshot.docs.map(doc => doc.data() as CallRoom);
  }

  async getActiveCallsForPatient(patientId: string): Promise<CallRoom[]> {
    const snapshot = await this.db
      .collection('callRooms')
      .where('patientId', '==', patientId)
      .where('status', 'in', ['waiting', 'active'])
      .get();

    return snapshot.docs.map(doc => doc.data() as CallRoom);
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const webrtcService = new WebRTCService();