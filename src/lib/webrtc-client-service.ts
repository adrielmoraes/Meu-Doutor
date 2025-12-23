import { db, collection, doc, getDocs, getDoc, updateDoc, addDoc, query, where, onSnapshot } from './firebase-client';
import type { DocumentData, QuerySnapshot } from 'firebase/firestore';
import type { CallRoom, CallSignal } from './webrtc-server-service';

export class WebRTCClientService {
  async createCallRoom(patientId: string, doctorId: string): Promise<string> {
    const roomId = this.generateRoomId();
    const room: CallRoom = {
      id: roomId,
      patientId,
      doctorId,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'callRooms'), room);
    return roomId;
  }

  async getCallRoom(roomId: string): Promise<CallRoom | null> {
    const docRef = doc(db, 'callRooms', roomId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as CallRoom) : null;
  }

  async updateCallStatus(roomId: string, status: CallRoom['status']): Promise<void> {
    const updateData: Partial<CallRoom> = { status };
    if (status === 'ended') {
      updateData.endedAt = new Date().toISOString();
    }
    
    const docRef = doc(db, 'callRooms', roomId);
    await updateDoc(docRef, updateData);
  }

  async sendSignal(roomId: string, signal: Omit<CallSignal, 'timestamp'>): Promise<void> {
    const fullSignal: CallSignal = {
      ...signal,
      timestamp: new Date().toISOString(),
    };

    await addDoc(collection(db, 'callRooms', roomId, 'signals'), fullSignal);
  }

  listenForSignals(
    roomId: string,
    userId: string,
    callback: (signal: CallSignal) => void
  ): () => void {
    const q = query(
      collection(db, 'callRooms', roomId, 'signals'),
      where('to', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          callback(change.doc.data() as CallSignal);
        }
      });
    });

    return unsubscribe;
  }

  async getActiveCallsForDoctor(doctorId: string): Promise<CallRoom[]> {
    const q = query(
      collection(db, 'callRooms'),
      where('doctorId', '==', doctorId),
      where('status', 'in', ['waiting', 'active'])
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallRoom));
  }

  async getActiveCallsForPatient(patientId: string): Promise<CallRoom[]> {
    const q = query(
      collection(db, 'callRooms'),
      where('patientId', '==', patientId),
      where('status', 'in', ['waiting', 'active'])
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallRoom));
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const webrtcClientService = new WebRTCClientService();
