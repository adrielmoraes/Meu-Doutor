import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminSearchPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Busca Global
        </h1>
        <p className="text-gray-400 mt-2">
          Busque pacientes, médicos, exames e consultas em toda a plataforma
        </p>
      </div>

      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-white">Buscar na Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Digite para buscar pacientes, médicos, exames..."
              className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-gray-500"
            />
          </div>
          <p className="text-sm text-gray-500 text-center py-12">
            Sistema de busca em desenvolvimento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
