
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
  result: string;
  icon: string; // Ideally, this would be an enum or a more specific type
  preliminaryDiagnosis: string;
  explanation: string;
  results: { name: string; value: string; reference: string }[];
};
