
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
import { Eye } from "lucide-react";
import Link from "next/link";
import { getPatients } from "@/lib/firestore-adapter";

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Meus Pacientes</h1>
        <p className="text-muted-foreground">
          Liste e acesse o perfil detalhado de cada paciente.
        </p>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead className="hidden md:table-cell">Idade</TableHead>
              <TableHead className="hidden lg:table-cell">Última Visita</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map(patient => (
              <TableRow key={patient.id}>
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
                <TableCell className="hidden lg:table-cell">{patient.lastVisit}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
