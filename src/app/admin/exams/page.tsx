import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getExams, getPatients } from "@/lib/db-adapter";
import { FileText, User, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminExamsPage() {
  const [exams, patients] = await Promise.all([
    getExams(),
    getPatients(),
  ]);
  
  const pendingExams = exams.filter((e: any) => e.status === 'Requer Validação');
  const validatedExams = exams.filter((e: any) => e.status === 'Validado');

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Gerenciar Exames
        </h1>
        <p className="text-gray-400 mt-2">
          {exams.length} exames enviados na plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-400 text-sm">Total de Exames</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{exams.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-yellow-400 text-sm">Aguardando Validação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{pendingExams.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-sm">Validados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{validatedExams.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Exams List */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-white">Lista de Exames</CardTitle>
          <CardDescription className="text-white">Visualize todos os exames e resultados de IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exams.length > 0 ? (
              exams.map((exam: any) => {
                const patient = patients.find((p: any) => p.id === exam.patientId);
                return (
                  <div key={exam.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-green-500/50 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-green-400" />
                          <h4 className="font-semibold text-white text-lg">{exam.type}</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <User className="h-3 w-3" />
                            <span>{patient?.name || 'Paciente desconhecido'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <CalendarDays className="h-3 w-3" />
                            <span>{new Date(exam.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div>
                            <Badge
                              variant={exam.status === 'Validado' ? 'secondary' : 'default'}
                              className={exam.status === 'Validado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                            >
                              {exam.status}
                            </Badge>
                          </div>
                        </div>
                        {exam.preliminaryDiagnosis && (
                          <div className="mt-3 p-3 bg-green-500/10 rounded border border-green-500/20">
                            <p className="text-xs text-gray-400 mb-1">Diagnóstico Preliminar (IA):</p>
                            <p className="text-sm text-gray-300 line-clamp-2">{exam.preliminaryDiagnosis}</p>
                          </div>
                        )}
                        {exam.doctorNotes && (
                          <div className="mt-2 p-3 bg-cyan-500/10 rounded border border-cyan-500/20">
                            <p className="text-xs text-gray-400 mb-1">Notas do Médico:</p>
                            <p className="text-sm text-gray-300 line-clamp-2">{exam.doctorNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum exame encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
