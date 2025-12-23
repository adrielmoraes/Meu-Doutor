'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, HardDrive, Users, Stethoscope, FileText, MessageSquare, Activity } from "lucide-react";

interface DatabaseSettingsProps {
  stats: {
    totalPatients: number;
    totalDoctors: number;
    totalExams: number;
    totalConsultations: number;
    pendingPatients: number;
    verifiedPatients: number;
  };
}

export function DatabaseSettings({ stats }: DatabaseSettingsProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Database className="h-5 w-5 text-purple-400" />
          Banco de Dados
        </CardTitle>
        <CardDescription className="text-white">Estatísticas e informações do banco de dados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Database Info */}
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <HardDrive className="h-4 w-4" />
            <span className="text-sm font-medium">Neon PostgreSQL</span>
          </div>
          <p className="text-xs text-gray-400">Banco de dados em nuvem gerenciado</p>
        </div>

        {/* Estatísticas */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Estatísticas de Dados</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900/50 border border-cyan-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs text-gray-400">Pacientes</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.totalPatients}</p>
              <p className="text-xs text-gray-500">{stats.verifiedPatients} verificados</p>
            </div>

            <div className="p-3 bg-slate-900/50 border border-purple-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs text-gray-400">Médicos</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.totalDoctors}</p>
            </div>

            <div className="p-3 bg-slate-900/50 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs text-gray-400">Exames</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.totalExams}</p>
            </div>

            <div className="p-3 bg-slate-900/50 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-xs text-gray-400">Consultas</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.totalConsultations}</p>
            </div>
          </div>
        </div>

        {/* Tabelas Principais */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Tabelas Principais</h3>
          
          <div className="space-y-2">
            {[
              { name: 'patients', description: 'Dados dos pacientes', icon: Users },
              { name: 'doctors', description: 'Dados dos médicos', icon: Stethoscope },
              { name: 'exams', description: 'Exames e análises', icon: FileText },
              { name: 'consultations', description: 'Histórico de consultas', icon: MessageSquare },
              { name: 'subscriptions', description: 'Assinaturas ativas', icon: Activity },
            ].map((table) => (
              <div
                key={table.name}
                className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-700/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <table.icon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{table.name}</p>
                    <p className="text-xs text-gray-500">{table.description}</p>
                  </div>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Info sobre Backup */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300">
            ℹ️ Backups automáticos são gerenciados pelo Neon PostgreSQL
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
