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
      return { color: 'text-red-400', bgColor: 'bg-red-500/20' };
    case 'Neurologia':
      return { color: 'text-purple-400', bgColor: 'bg-purple-500/20' };
    case 'Ortopedia':
      return { color: 'text-orange-400', bgColor: 'bg-orange-500/20' };
    case 'Clínico Geral':
      return { color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
    case 'Hematologia':
      return { color: 'text-rose-400', bgColor: 'bg-rose-500/20' };
    case 'Patologia':
      return { color: 'text-teal-400', bgColor: 'bg-teal-500/20' };
    default:
      return { color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' };
  }
}

const priorityMap = {
  'Urgente': {
    level: 1,
    icon: <ShieldAlert className="h-4 w-4" />,
    label: 'Urgente',
    className: 'bg-red-500/20 text-red-300 border-red-500/30'
  },
  'Alta': {
    level: 2,
    icon: <ArrowUp className="h-4 w-4" />,
    label: 'Alta',
    className: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  },
  'Normal': {
    level: 3,
    icon: <ArrowDown className="h-4 w-4" />,
    label: 'Normal',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
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
  const { patients, error } = await getPatientsWithSpecialty();

  const stats = patients ? {
    total: patients.length,
    pending: patients.filter(p => p.status === 'Requer Validação').length,
    validated: patients.filter(p => p.status === 'Validado').length,
    urgent: patients.filter(p => p.priority === 'Urgente' && p.status !== 'Validado').length,
  } : { total: 0, pending: 0, validated: 0, urgent: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Meus Pacientes
          </h1>
          <p className="text-blue-200/70 mt-1">
            Gerencie e acompanhe seus pacientes por especialidade
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-200/70">Total</p>
                <p className="text-2xl font-bold text-cyan-300">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-cyan-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-200/70">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-300">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-200/70">Validados</p>
                <p className="text-2xl font-bold text-green-300">{stats.validated}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-200/70">Urgentes</p>
                <p className="text-2xl font-bold text-red-300">{stats.urgent}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-red-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {error || !patients ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                <TableHead className="text-cyan-300">Paciente</TableHead>
                <TableHead className="text-cyan-300">Especialidade</TableHead>
                <TableHead className="hidden md:table-cell text-cyan-300">Idade</TableHead>
                <TableHead className="text-cyan-300">Prioridade</TableHead>
                <TableHead className="text-cyan-300">Status</TableHead>
                <TableHead className="text-right text-cyan-300">Ações</TableHead>
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
                    className={`border-slate-700/30 hover:bg-slate-800/50 transition-colors ${
                      isInvalidated && priorityInfo.level === 1 ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-slate-700">
                          <AvatarImage src={patient.avatar} data-ai-hint={patient.avatarHint} />
                          <AvatarFallback className="bg-slate-700 text-cyan-300">
                            {patient.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium text-white">{patient.name}</span>
                          {patient.examTypes.length > 0 && (
                            <p className="text-xs text-blue-200/50 mt-0.5">
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
                        className={`flex items-center gap-1.5 w-fit ${specialtyStyle.bgColor} ${specialtyStyle.color} border-transparent`}
                      >
                        <SpecialtyIcon specialty={patient.specialty} />
                        {patient.specialty}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-blue-200/70">
                      {patient.age} anos
                    </TableCell>
                    <TableCell>
                      {isInvalidated ? (
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1.5 w-fit ${priorityInfo.className}`}
                        >
                          {priorityInfo.icon}
                          {priorityInfo.label}
                        </Badge>
                      ) : (
                        <span className="text-blue-200/50">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={patient.status === 'Validado'
                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        }
                      >
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                      >
                        <Link href={`/doctor/patients/${patient.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {patients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-blue-200/50 py-12">
                    Nenhum paciente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}