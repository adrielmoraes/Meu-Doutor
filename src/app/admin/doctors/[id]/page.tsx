import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDoctorById, getConsultationsByDoctor } from "@/lib/db-adapter";
import { ArrowLeft, Stethoscope, Mail, MapPin, Award, TrendingUp, MessageSquare, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminDoctorDetailPage({ params }: { params: { id: string } }) {
  const [doctor, consultations] = await Promise.all([
    getDoctorById(params.id),
    getConsultationsByDoctor(params.id)
  ]);

  if (!doctor) {
    notFound();
  }

  const totalValidations = doctor.validations || 0;
  const currentLevel = doctor.level || 1;
  const currentXP = doctor.xp || 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/admin/doctors" className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-all">
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {doctor.name}
          </h1>
          <p className="text-gray-400 mt-2">{doctor.specialty}</p>
        </div>
        {doctor.online && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            Online
          </Badge>
        )}
      </div>

      {/* Doctor Info Card */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Informações do Médico</CardTitle>
          <CardDescription>Dados cadastrais e informações profissionais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <Mail className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-white">{doctor.email}</p>
              </div>
            </div>
            {(doctor.city || doctor.state) && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <MapPin className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-500">Localização</p>
                  <p className="text-sm text-white">{[doctor.city, doctor.state].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <Stethoscope className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-500">Especialidade</p>
                <p className="text-sm text-white">{doctor.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <Award className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-500">Nível / XP</p>
                <p className="text-sm text-white">Nível {currentLevel} • {currentXP} XP</p>
              </div>
            </div>
          </div>

          {doctor.badges && doctor.badges.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-xs text-purple-400 font-semibold mb-3">Conquistas</p>
              <div className="flex flex-wrap gap-2">
                {doctor.badges.map((badge: any, idx: number) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" />
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Validações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalValidations}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-orange-400 text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{consultations.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
              <Award className="h-4 w-4" />
              Nível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{currentLevel}</div>
          </CardContent>
        </Card>
      </div>

      {/* Consultations List */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Consultas</CardTitle>
          <CardDescription>Todas as consultas realizadas pelo médico</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {consultations.length > 0 ? (
              consultations.map((consultation: any) => (
                <div key={consultation.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="h-5 w-5 text-orange-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className={
                          consultation.type === 'video-call' 
                            ? 'border-purple-500/50 text-purple-400' 
                            : 'border-cyan-500/50 text-cyan-400'
                        }>
                          {consultation.type === 'video-call' ? 'Vídeo' : 'Chat'}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {new Date(consultation.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      {consultation.summary && (
                        <div className="p-3 bg-orange-500/10 rounded border border-orange-500/20">
                          <p className="text-xs text-orange-400 mb-1">Resumo:</p>
                          <p className="text-sm text-gray-300">{consultation.summary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Nenhuma consulta realizada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
