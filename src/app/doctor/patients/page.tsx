
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
import { AlertTriangle, Eye, ShieldAlert, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { getPatients } from "@/lib/firestore-client-adapter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Patient } from "@/types";


const priorityMap = {
    'Urgente': {
        level: 1,
        icon: <ShieldAlert className="h-4 w-4 text-red-500" />,
        label: 'Urgente',
        className: 'bg-red-100 text-red-800'
    },
    'Alta': {
        level: 2,
        icon: <ArrowUp className="h-4 w-4 text-orange-500" />,
        label: 'Alta',
        className: 'bg-orange-100 text-orange-800'
    },
    'Normal': {
        level: 3,
        icon: <ArrowDown className="h-4 w-4 text-blue-500" />,
        label: 'Normal',
        className: 'bg-blue-100 text-blue-800'
    },
};

const sortPatients = (patients: Patient[]): Patient[] => {
    return patients.sort((a, b) => {
        // Sort validated patients to the bottom
        if (a.status === 'Validado' && b.status !== 'Validado') return 1;
        if (a.status !== 'Validado' && b.status === 'Validado') return -1;
        if (a.status === 'Validado' && b.status === 'Validado') return 0;

        // Then sort by priority level
        const priorityA = priorityMap[a.priority || 'Normal'].level;
        const priorityB = priorityMap[b.priority || 'Normal'].level;
        return priorityA - priorityB;
    });
}


async function getPatientsData(): Promise<{ patients: Patient[] | null, error?: string, fixUrl?: string}> {
    try {
        const patients = await getPatients();
        const sortedPatients = sortPatients(patients);
        return { patients: sortedPatients };
    } catch (e: any) {
        const errorMessage = e.message?.toLowerCase() || '';
        const errorCode = e.code?.toLowerCase() || '';
        
        if (errorMessage.includes('client is offline') || errorMessage.includes('5 not_found') || errorCode.includes('not-found')) {
            const firestoreApiUrl = `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;
            return { 
                patients: null,
                error: "Não foi possível conectar ao banco de dados. A API do Cloud Firestore pode estar desativada ou o cliente está offline.",
                fixUrl: firestoreApiUrl 
            };
        }
        console.error("Unexpected error fetching patients:", e);
        return { patients: null, error: "Ocorreu um erro inesperado ao carregar a lista de pacientes." };
    }
}

export default async function PatientsPage() {
  const { patients, error, fixUrl } = await getPatientsData();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Meus Pacientes</h1>
        <p className="text-muted-foreground">
          Liste e acesse o perfil detalhado de cada paciente, priorizado por urgência.
        </p>
      </div>

       {error || !patients ? (
           <div className="container mx-auto">
               <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Erro de Configuração ou Conexão</AlertTitle>
                   <AlertDescription>
                       {error}
                       {fixUrl && (
                           <p className="mt-2">
                               Por favor, habilite a API manualmente visitando o seguinte link e clicando em "Habilitar":
                               <br />
                               <Link href={fixUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                                   Habilitar API do Firestore
                               </Link>
                               <br />
                               <span className="text-xs">Após habilitar, aguarde alguns minutos e atualize esta página.</span>
                           </p>
                       )}
                   </AlertDescription>
               </Alert>
           </div>
        ) : (
             <div className="rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="hidden md:table-cell">Idade</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {patients.map(patient => {
                        const priorityInfo = priorityMap[patient.priority || 'Normal'];
                        const isInvalidated = patient.status !== 'Validado';

                        return (
                            <TableRow key={patient.id} className={isInvalidated && priorityInfo.level === 1 ? 'bg-red-50' : ''}>
                                <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                    <AvatarImage src={patient.avatar} data-ai-hint={patient.avatarHint} />
                                    <AvatarFallback>{patient.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{patient.name}</span>
                                </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{patient.age}</TableCell>
                                <TableCell>
                                    {isInvalidated ? (
                                        <Badge variant="outline" className={`flex items-center gap-1.5 ${priorityInfo.className}`}>
                                            {priorityInfo.icon}
                                            {priorityInfo.label}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={patient.status === 'Validado' ? 'secondary' : 'default'} className={patient.status === 'Validado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                        {patient.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                <Button asChild variant="ghost" size="icon">
                                    <Link href={`/doctor/patients/${patient.id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Ver Paciente</span>
                                    </Link>
                                </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    )}
                     {patients.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                Nenhum paciente encontrado. Execute `npm run db:seed` para popular o banco de dados.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
        )}
    </div>
  );
}
