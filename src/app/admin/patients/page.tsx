import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPatients, getExamsByPatientId } from "@/lib/db-adapter";
import { Users, Search, FileText, Mail, Phone, MapPin, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default async function AdminPatientsPage() {
  const patients = await getPatients();
  
  // Organizar por status
  const pendingPatients = patients.filter((p: any) => p.status === 'Requer Validação');
  const validatedPatients = patients.filter((p: any) => p.status === 'Validado');

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Gerenciar Pacientes
          </h1>
          <p className="text-gray-400 mt-2">
            {patients.length} pacientes cadastrados na plataforma
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-sm">Total de Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{patients.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-yellow-400 text-sm">Pendentes de Validação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{pendingPatients.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-400 text-sm">Validados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{validatedPatients.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-white">Lista de Pacientes</CardTitle>
          <CardDescription className="text-slate-300">Visualize e gerencie todos os pacientes cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patients.length > 0 ? (
              patients.map((patient: any) => (
                <Link key={patient.id} href={`/admin/patients/${patient.id}`}>
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {patient.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-lg">{patient.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{patient.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Phone className="h-3 w-3" />
                              <span>{patient.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <MapPin className="h-3 w-3" />
                              <span>{patient.city}, {patient.state}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <CalendarDays className="h-3 w-3" />
                              <span>{patient.age} anos</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={patient.status === 'Validado' ? 'secondary' : 'default'}
                        className={patient.status === 'Validado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                      >
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum paciente cadastrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
