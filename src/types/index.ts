

export type Patient = {
  id: string;
  name: string;
  age: number;
  birthDate: string;
  cpf: string;
  phone: string;
  email: string;
  lastVisit: string;
  status: 'Requer Validação' | 'Validado';
  avatar: string;
  avatarHint: string;
  gender: string;
  conversationHistory: string;
  reportedSymptoms: string;
  examResults: string;
  doctorNotes?: string;
  preventiveAlerts?: string[];
  healthGoals?: {
      title: string;
      description: string;
      progress: number;
  }[];
  finalExplanation?: string;
  finalExplanationAudioUri?: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  online: boolean;
  avatar: string;
  avatarHint: string;
  email: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  validations: number;
  badges: {
      name: string;
      icon: 'Award' | 'Star' | 'Clock' | 'Zap';
      description: string;
  }[];
};

export type Exam = {
  id: string;
  type: string;
  date: string;
  result: string; // A summary of the result, e.g., the preliminary diagnosis
  icon: string; // Lucide icon name
  preliminaryDiagnosis: string;
  explanation: string;
  results?: { name: string; value: string; reference: string }[];
};

export type Appointment = {
    id: string;
    patientId: string;
    patientName: string;
    patientAvatar?: string;
    doctorId: string;
    date: string;
    time: string;
    type: string;
    status: 'Agendada' | 'Concluída' | 'Cancelada';
};
