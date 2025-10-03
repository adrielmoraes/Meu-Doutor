

export type Patient = {
  id: string;
  name: string;
  age: number;
  birthDate: string;
  cpf: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  lastVisit: string;
  // This top-level status can represent if the patient has any pending exams.
  status: 'Requer Validação' | 'Validado'; 
  priority?: 'Urgente' | 'Alta' | 'Normal';
  avatar: string;
  avatarHint: string;
  gender: string;
  conversationHistory: string;
  reportedSymptoms: string;
  examResults: string; // Summary of all results for AI context
  doctorNotes?: string; // Kept for general notes, but validation is per exam.
  preventiveAlerts?: string[];
  healthGoals?: {
      title: string;
      description: string;
      progress: number;
  }[];
  // Final explanation at patient level is being deprecated in favor of per-exam.
  finalExplanation?: string;
  finalExplanationAudioUri?: string;
};

// Type for authentication that includes the hashed password
export type PatientWithPassword = Patient & { password?: string | null };

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  city: string;
  state: string;
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
      icon: 'Award' | 'Star' | 'Clock' | 'Zap' | 'CheckSquare';
      description: string;
  }[];
  // NOVO CAMPO: Disponibilidade do médico
  availability?: { date: string; time: string; available: boolean }[];
};

// Type for authentication that includes the hashed password
export type DoctorWithPassword = Doctor & { password?: string | null };

export type Exam = {
  id: string;
  patientId: string;
  type: string;
  date: string;
  result: string; // A summary of the result, e.g., the preliminary diagnosis
  icon: string; // Lucide icon name
  preliminaryDiagnosis: string;
  explanation: string;
  suggestions: string;
  results?: { name: string; value: string; reference: string }[];
  status: 'Requer Validação' | 'Validado';
  doctorNotes?: string;
  finalExplanation?: string;
  finalExplanationAudioUri?: string;
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

export type CallRecording = {
    transcription: string;
    summary: string;
    processedAt: string;
    audioStoredAt: string | null;
};

export type Consultation = {
    id: string;
    doctorId: string;
    patientId: string;
    roomId: string;
    transcription: string;
    summary: string;
    date: string;
    type: 'video-call' | 'chat';
};
