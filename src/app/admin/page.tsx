import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPatients, getDoctors, getExams, getConsultations } from "@/lib/db-adapter";
import { Users, Stethoscope, FileText, MessageSquare, TrendingUp, Activity, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  // Buscar dados gerais
  const [patients, doctors, allExams, consultations] = await Promise.all([
    getPatients(),
    getDoctors(),
    getExams(),
    getConsultations(),
  ]);

  const stats = [
    {
      title: "Total de Pacientes",
      value: patients.length,
      icon: Users,
      gradient: "from-cyan-500 to-blue-500",
      description: `${patients.filter((p: any) => p.status === 'Requer Validação').length} pendentes de validação`,
      href: "/admin/patients"
    },
    {
      title: "Total de Médicos",
      value: doctors.length,
      icon: Stethoscope,
      gradient: "from-purple-500 to-pink-500",
      description: `${doctors.filter((d: any) => d.online).length} médicos online`,
      href: "/admin/doctors"
    },
    {
      title: "Total de Exames",
      value: allExams.length,
      icon: FileText,
      gradient: "from-green-500 to-emerald-500",
      description: `${allExams.filter((e: any) => e.status === 'Requer Validação').length} aguardando validação`,
      href: "/admin/exams"
    },
    {
      title: "Total de Consultas",
      value: consultations.length,
      icon: MessageSquare,
      gradient: "from-orange-500 to-red-500",
      description: "Consultas realizadas",
      href: "/admin/consultations"
    },
  ];

  // Atividades recentes (últimos exames e pacientes)
  const recentExams = allExams
    .sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);
  
  const recentPatients = patients
    .sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Painel de Administração
        </h1>
        <p className="text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
          Visão geral completa da plataforma MediAI
        </p>
      </div>

      {/* Stats Grid - Otimizado para Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden cursor-pointer">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 relative">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${stat.gradient} flex-shrink-0`}>
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative p-4 pt-0 md:p-6 md:pt-0">
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity - Otimizado para Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Exams */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-cyan-400 text-base sm:text-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Exames Recentes
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Últimos 5 exames enviados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-4 pt-0 md:p-6 md:pt-0">
            {recentExams.length > 0 ? (
              recentExams.map((exam: any) => {
                const patient = patients.find((p: any) => p.id === exam.patientId);
                return (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">{exam.type}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 truncate">{patient?.name || 'Paciente desconhecido'}</p>
                    </div>
                    <Badge
                      variant={exam.status === 'Validado' ? 'secondary' : 'default'}
                      className={`text-[10px] sm:text-xs flex-shrink-0 ${exam.status === 'Validado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                    >
                      {exam.status}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 text-center py-4">Nenhum exame recente</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-purple-400 text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Pacientes Recentes
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Últimos 5 pacientes cadastrados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-4 pt-0 md:p-6 md:pt-0">
            {recentPatients.length > 0 ? (
              recentPatients.map((patient: any) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] sm:text-xs font-bold text-white">
                        {patient.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">{patient.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 truncate">{patient.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant={patient.status === 'Validado' ? 'secondary' : 'default'}
                    className={`text-[10px] sm:text-xs flex-shrink-0 ${patient.status === 'Validado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                  >
                    {patient.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 text-center py-4">Nenhum paciente recente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Otimizado para Mobile */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-white text-base sm:text-lg">Ações Rápidas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Acesso rápido às funcionalidades principais</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 pt-0 md:p-6 md:pt-0">
          <Link href="/admin/patients">
            <div className="p-3 sm:p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer text-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-white">Ver Pacientes</p>
            </div>
          </Link>
          <Link href="/admin/doctors">
            <div className="p-3 sm:p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer text-center">
              <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-white">Ver Médicos</p>
            </div>
          </Link>
          <Link href="/admin/exams">
            <div className="p-3 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/20 hover:border-green-500/50 transition-all cursor-pointer text-center">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-white">Ver Exames</p>
            </div>
          </Link>
          <Link href="/admin/search">
            <div className="p-3 sm:p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/50 transition-all cursor-pointer text-center">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-white">Busca Global</p>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
