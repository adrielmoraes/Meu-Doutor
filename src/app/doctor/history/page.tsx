
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getPatients } from "@/lib/db-adapter";
import type { Patient } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Helper function to extract the diagnosis from doctor's notes
const getValidatedDiagnosis = (patient: Patient): string => {
  if (patient.status !== 'Validado' || !patient.doctorNotes) {
    return 'N/A';
  }
  // Extracts the first line of the notes, assuming it's the diagnosis.
  return patient.doctorNotes.split('\n')[0] || 'Diagnóstico não especificado';
}

async function getHistoryData(): Promise<{ history: Patient[], error?: string }> {
    try {
        const allPatients = await getPatients();
        const history = allPatients.filter((p: Patient) => p.status === 'Validado');
        return { history };
    } catch (e: any) {
        console.error("Unexpected error fetching history:", e);
        return { history: [], error: "Ocorreu um erro inesperado ao carregar o histórico." };
    }
}


export default async function ProfessionalHistoryPage() {
  const { history, error } = await getHistoryData();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Atendimentos</h1>
        <p className="text-muted-foreground">
          Revise todos os pacientes que você atendeu e os diagnósticos que validou.
        </p>
      </div>

       {error ? (
           <div className="container mx-auto">
               <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Erro ao Carregar Histórico</AlertTitle>
                   <AlertDescription>
                       {error}
                   </AlertDescription>
               </Alert>
           </div>
        ) : (
             <div className="rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="hidden md:table-cell">Data do Atendimento</TableHead>
                    <TableHead>Diagnóstico Validado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {history.map(entry => (
                    <TableRow key={entry.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarFallback>{entry.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{entry.name}</span>
                        </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{entry.lastVisit}</TableCell>
                        <TableCell>
                            <p className="font-medium">{getValidatedDiagnosis(entry)}</p>
                        </TableCell>
                        <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/doctor/patients/${entry.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver Detalhes do Caso</span>
                            </Link>
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                    {history.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                Nenhum atendimento validado encontrado.
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
