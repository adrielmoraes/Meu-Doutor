import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Shield, Database, Bell } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Configurações
        </h1>
        <p className="text-gray-400 mt-2">
          Gerencie as configurações da plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-cyan-400" />
              Segurança
            </CardTitle>
            <CardDescription>Configurações de segurança e autenticação</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Em desenvolvimento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="h-5 w-5 text-purple-400" />
              Banco de Dados
            </CardTitle>
            <CardDescription>Gerenciamento e backup de dados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Em desenvolvimento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Bell className="h-5 w-5 text-green-400" />
              Notificações
            </CardTitle>
            <CardDescription>Configurações de notificações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Em desenvolvimento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="h-5 w-5 text-orange-400" />
              Geral
            </CardTitle>
            <CardDescription>Configurações gerais da plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Em desenvolvimento</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
