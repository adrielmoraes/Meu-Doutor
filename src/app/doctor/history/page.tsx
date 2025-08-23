import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

const history = [
  { id: '1', patientId: '2', name: 'Beatriz Lima', date: '2024-08-12', diagnosis: 'Função tireoidiana normal' },
  { id: '2', patientId: '4', name: 'Juliana Ribeiro', date: '2024-07-28', diagnosis: 'Anemia por deficiência de ferro' },
  { id: '3', patientId: '5', name: 'Ricardo Alves', date: '2024-07-15', diagnosis: 'Sinusite aguda' },
  { id: '4', patientId: '6', name: 'Patricia Souza', date: '2024-06-20', diagnosis: 'Infecção do trato urinário' },
];

export default function ProfessionalHistoryPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Atendimentos</h1>
        <p className="text-muted-foreground">
          Revise todos os pacientes que você atendeu e os diagnósticos que validou.
        </p>
      </div>
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
                <TableCell className="hidden md:table-cell">{entry.date}</TableCell>
                <TableCell>
                    <p className="font-medium">{entry.diagnosis}</p>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/doctor/patients/${entry.patientId}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver Detalhes do Caso</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
