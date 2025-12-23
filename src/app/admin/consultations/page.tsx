import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getConsultations, getPatients, getDoctors } from "@/lib/db-adapter";
import { MessageSquare, User, Stethoscope, CalendarDays, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminConsultationsPage() {
  const [consultations, patients, doctors] = await Promise.all([
    getConsultations(),
    getPatients(),
    getDoctors(),
  ]);

  const videoConsultations = consultations.filter((c: any) => c.type === 'video-call');
  const chatConsultations = consultations.filter((c: any) => c.type === 'chat');

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          Gerenciar Consultas
        </h1>
        <p className="text-gray-400 mt-2">
          {consultations.length} consultas realizadas na plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-orange-400 text-sm">Total de Consultas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{consultations.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm">Chamadas de Vídeo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{videoConsultations.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-sm">Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{chatConsultations.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Consultations List */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
        <CardHeader>
          <CardTitle className="text-white">Lista de Consultas</CardTitle>
          <CardDescription className="text-white">Visualize todas as consultas e conversas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {consultations.length > 0 ? (
              consultations.map((consultation: any) => {
                const patient = patients.find((p: any) => p.id === consultation.patientId);
                const doctor = doctors.find((d: any) => d.id === consultation.doctorId);
                return (
                  <div key={consultation.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-orange-500/50 transition-all">
                    <div className="flex items-start gap-4">
                      <MessageSquare className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className={
                            consultation.type === 'video-call' 
                              ? 'border-purple-500/50 text-purple-400' 
                              : 'border-cyan-500/50 text-cyan-400'
                          }>
                            {consultation.type === 'video-call' ? 'Vídeo' : 'Chat'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-cyan-400" />
                            <span className="text-gray-300">{patient?.name || 'Paciente desconhecido'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Stethoscope className="h-3 w-3 text-purple-400" />
                            <span className="text-gray-300">{doctor?.name || 'Médico desconhecido'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <CalendarDays className="h-3 w-3" />
                            <span>{new Date(consultation.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>

                        {consultation.summary && (
                          <div className="p-3 bg-orange-500/10 rounded border border-orange-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-3 w-3 text-orange-400" />
                              <p className="text-xs text-orange-400 font-semibold">Resumo da Consulta:</p>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-3">{consultation.summary}</p>
                          </div>
                        )}

                        {consultation.transcription && (
                          <details className="mt-2">
                            <summary className="text-xs text-cyan-400 cursor-pointer hover:text-cyan-300">
                              Ver transcrição completa
                            </summary>
                            <div className="mt-2 p-3 bg-slate-900/50 rounded border border-slate-700/50">
                              <p className="text-xs text-gray-400 whitespace-pre-wrap">{consultation.transcription}</p>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Nenhuma consulta encontrada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
