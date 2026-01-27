import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Eye,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Users,
  Clock,
  CheckCircle,
  Stethoscope,
  Heart,
  Brain,
  Bone,
  Activity,
  Droplets,
  Microscope
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Patient, Exam } from "@/types";
import { getPatients, getExams } from "@/lib/db-adapter";
import { getSession } from "@/lib/session";
import PrescriptionModal from "@/components/doctor/prescription-modal";
import { redirect } from "next/navigation";

const examToSpecialty: Record<string, string> = {
  'Hemograma': 'Hematologia',
  'Hemograma Completo': 'Hematologia',
  'Eletrocardiograma': 'Cardiologia',
  'ECG': 'Cardiologia',
  'Ecocardiograma': 'Cardiologia',
  'Teste de Esforço': 'Cardiologia',
  'Holter': 'Cardiologia',
  'Ressonância Magnética': 'Neurologia',
  'Tomografia': 'Neurologia',
  'Eletroencefalograma': 'Neurologia',
  'Raio-X': 'Ortopedia',
  'Densitometria': 'Ortopedia',
  'Ultrassom': 'Clínico Geral',
  'Glicemia': 'Clínico Geral',
  'Colesterol': 'Clínico Geral',
  'Triglicerídeos': 'Clínico Geral',
  'TSH': 'Clínico Geral',
  'T4': 'Clínico Geral',
  'Biópsia': 'Patologia',
  'Citologia': 'Patologia',
};

function getSpecialtyFromExamType(examType: string): string {
  for (const [key, specialty] of Object.entries(examToSpecialty)) {
    if (examType.toLowerCase().includes(key.toLowerCase())) {
      return specialty;
    }
  }
  return 'Geral';
}

function SpecialtyIcon({ specialty }: { specialty: string }) {
  switch (specialty) {
    case 'Cardiologia':
      return <Heart className="h-3.5 w-3.5" />;
    case 'Neurologia':
      return <Brain className="h-3.5 w-3.5" />;
    case 'Ortopedia':
      return <Bone className="h-3.5 w-3.5" />;
    case 'Clínico Geral':
      return <Activity className="h-3.5 w-3.5" />;
    case 'Hematologia':
      return <Droplets className="h-3.5 w-3.5" />;
    case 'Patologia':
      return <Microscope className="h-3.5 w-3.5" />;
    default:
      return <Stethoscope className="h-3.5 w-3.5" />;
  }
}

function getSpecialtyStyle(specialty: string): { color: string; bgColor: string } {
  switch (specialty) {
    case 'Cardiologia':
      return { color: 'text-red-700', bgColor: 'bg-red-50' };
    case 'Neurologia':
      return { color: 'text-purple-700', bgColor: 'bg-purple-50' };
    case 'Ortopedia':
      return { color: 'text-orange-700', bgColor: 'bg-orange-50' };
    case 'Clínico Geral':
      return { color: 'text-blue-700', bgColor: 'bg-blue-50' };
    case 'Hematologia':
      return { color: 'text-rose-700', bgColor: 'bg-rose-50' };
    case 'Patologia':
      return { color: 'text-teal-700', bgColor: 'bg-teal-50' };
    default:
      return { color: 'text-slate-700', bgColor: 'bg-slate-50' };
  }
}

const priorityMap = {
  'Urgente': {
    level: 1,
    icon: <ShieldAlert className="h-4 w-4" />,
    label: 'Urgente',
    className: 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-100/50'
  },
  'Alta': {
    level: 2,
    icon: <ArrowUp className="h-4 w-4" />,
    label: 'Alta',
    className: 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm shadow-orange-100/50'
  },
  'Normal': {
    level: 3,
    icon: <ArrowDown className="h-4 w-4" />,
    label: 'Normal',
    className: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-100/50'
  },
};

type PatientWithSpecialty = Patient & {
  specialty: string;
  examTypes: string[];
};

function sortPatients(patients: PatientWithSpecialty[]): PatientWithSpecialty[] {
  return patients.sort((a, b) => {
    if (a.status === 'Validado' && b.status !== 'Validado') return 1;
    if (a.status !== 'Validado' && b.status === 'Validado') return -1;
    if (a.status === 'Validado' && b.status === 'Validado') return 0;

    const priorityA = priorityMap[a.priority || 'Normal'].level;
    const priorityB = priorityMap[b.priority || 'Normal'].level;
    return priorityA - priorityB;
  });
}

async function getPatientsWithSpecialty(): Promise<{ patients: PatientWithSpecialty[] | null; error?: string }> {
  try {
    const [patientsData, examsData] = await Promise.all([
      getPatients(),
      getExams()
    ]);

    const patientsWithSpecialty: PatientWithSpecialty[] = patientsData.map(patient => {
      const patientExams = examsData.filter(exam => exam.patientId === patient.id);
      const examTypes = [...new Set(patientExams.map(e => e.type))];

      const specialties = examTypes.map(type => getSpecialtyFromExamType(type));
      const uniqueSpecialties = [...new Set(specialties)];
      const primarySpecialty = uniqueSpecialties[0] || 'Geral';

      return {
        ...patient,
        specialty: primarySpecialty,
        examTypes,
      };
    });

    return { patients: sortPatients(patientsWithSpecialty) };
  } catch (e: any) {
    console.error("Error fetching patients:", e);
    return { patients: null, error: "Ocorreu um erro ao carregar a lista de pacientes." };
  }
}

export default async function PatientsPage() {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
    redirect('/login');
  }

  const { patients, error } = await getPatientsWithSpecialty();

  const stats = patients ? {
    total: patients.length,
    pending: patients.filter(p => p.status === 'Requer Validação').length,
    validated: patients.filter(p => p.status === 'Validado').length,
    urgent: patients.filter(p => p.priority === 'Urgente' && p.status !== 'Validado').length,
  } : { total: 0, pending: 0, validated: 0, urgent: 0 };

  return (
    <div className="bg-slate-50 min-h-screen relative font-sans text-slate-900">
      {/* Background Decor - Subtle & Clean */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-60"></div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Meus Pacientes
            </h1>
            <p className="text-slate-500 mt-2">
              Gerencie e acompanhe seus pacientes por especialidade
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Validados</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.validated}</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Urgentes</p>
                  <p className="text-2xl font-bold text-rose-600">{stats.urgent}</p>
                </div>
                <div className="bg-rose-50 p-2 rounded-lg">
                  <ShieldAlert className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error || !patients ? (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-500 font-semibold py-4">Paciente</TableHead>
                    <TableHead className="text-slate-500 font-semibold py-4">Especialidade</TableHead>
                    <TableHead className="hidden md:table-cell text-slate-500 font-semibold py-4">Idade</TableHead>
                    <TableHead className="text-slate-500 font-semibold py-4">Prioridade</TableHead>
                    <TableHead className="text-slate-500 font-semibold py-4">Status</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold py-4">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map(patient => {
                    const priorityInfo = priorityMap[patient.priority || 'Normal'];
                    const isInvalidated = patient.status !== 'Validado';
                    const specialtyStyle = getSpecialtyStyle(patient.specialty);

                    return (
                      <TableRow
                        key={patient.id}
                        className={`border-slate-100 hover:bg-slate-50/80 transition-colors ${isInvalidated && priorityInfo.level === 1 ? 'bg-rose-50/30' : ''
                          }`}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
                              <AvatarImage src={patient.avatar} data-ai-hint={patient.avatarHint} />
                              <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                                {patient.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-semibold text-slate-900 block">{patient.name}</span>
                              {patient.examTypes.length > 0 && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {patient.examTypes.slice(0, 2).join(', ')}
                                  {patient.examTypes.length > 2 && ` +${patient.examTypes.length - 2}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1.5 w-fit px-2.5 py-1 font-medium ${specialtyStyle.bgColor} ${specialtyStyle.color} border-transparent shadow-sm`}
                          >
                            <SpecialtyIcon specialty={patient.specialty} />
                            {patient.specialty}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-slate-600">
                          {patient.age} anos
                        </TableCell>
                        <TableCell>
                          {isInvalidated ? (
                            <Badge
                              variant="outline"
                              className={`flex items-center gap-1.5 w-fit px-2.5 py-1 ${priorityInfo.className}`}
                            >
                              {priorityInfo.icon}
                              {priorityInfo.label}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 font-medium italic">Finalizado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={patient.status === 'Validado'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-1 font-medium'
                              : 'bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-1 font-medium'
                            }
                          >
                            {patient.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <PrescriptionModal
                              doctor={{ id: session.userId }}
                              patients={[patient]}
                              initialPatientId={patient.id}
                              variant="compact"
                            />
                            <Button
                              asChild
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm rounded-lg px-4 py-2 h-9"
                            >
                              <Link href={`/doctor/patients/${patient.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Prontuário
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {patients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                        Nenhum paciente encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
