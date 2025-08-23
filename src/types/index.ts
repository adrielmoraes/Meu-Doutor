
export type Patient = {
  id: string;
  name: string;
  age: number;
  lastVisit: string;
  status: 'Requer Validação' | 'Validado';
  avatar: string;
  avatarHint: string;
  gender: string;
  conversationHistory: string;
  reportedSymptoms: string;
  examResults: string;
  doctorNotes?: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  online: boolean;
  avatar: string;
  avatarHint: string;
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
