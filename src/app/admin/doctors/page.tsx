import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDoctors } from "@/lib/db-adapter";
import { Stethoscope, Mail, MapPin, Award, TrendingUp, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminDoctorsPage() {
  const doctors = await getDoctors();
  
  const onlineDoctors = doctors.filter((d: any) => d.online);
  const totalValidations = doctors.reduce((sum: number, d: any) => sum + (d.validations || 0), 0);
  const averageLevel = Math.round(doctors.reduce((sum: number, d: any) => sum + (d.level || 1), 0) / doctors.length);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Gerenciar Médicos
          </h1>
          <p className="text-gray-400 mt-2">
            {doctors.length} médicos cadastrados na plataforma
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm">Total de Médicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{doctors.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-400 text-sm">Médicos Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{onlineDoctors.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-sm">Total de Validações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalValidations}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-orange-400 text-sm">Nível Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{averageLevel}</div>
          </CardContent>
        </Card>
      </div>

      {/* Doctor List */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Lista de Médicos</CardTitle>
          <CardDescription>Visualize e gerencie todos os médicos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {doctors.length > 0 ? (
              doctors.map((doctor: any) => (
                <div key={doctor.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-white text-lg">{doctor.name}</h4>
                          {doctor.online && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              Online
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Stethoscope className="h-3 w-3" />
                            <span>{doctor.specialty}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{doctor.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MapPin className="h-3 w-3" />
                            <span>{doctor.city}, {doctor.state}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Award className="h-3 w-3" />
                            <span>Nível {doctor.level} • {doctor.validations} validações</span>
                          </div>
                        </div>
                        {doctor.badges && doctor.badges.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {doctor.badges.slice(0, 3).map((badge: any, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs border-cyan-500/30 text-cyan-400"
                              >
                                {badge.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum médico cadastrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
