import { getAllPatientsUsageStats } from "@/lib/db-adapter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Clock, FileText, Mic, MessageCircle, Phone, TrendingUp, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatCost(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2)}`;
}

export default async function UsagePage() {
  const usageStats = await getAllPatientsUsageStats();
  
  // Ordenar por uso total de tokens (maior para menor)
  const sortedStats = usageStats.sort((a, b) => b.totalTokens - a.totalTokens);
  
  // Calcular totais gerais
  const totals = usageStats.reduce((acc, stat) => ({
    tokens: acc.tokens + stat.totalTokens,
    callDuration: acc.callDuration + stat.totalCallDuration,
    cost: acc.cost + stat.totalCost,
    exams: acc.exams + stat.examAnalysisCount,
  }), { tokens: 0, callDuration: 0, cost: 0, exams: 0 });

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Uso de Recursos por Paciente
        </h1>
        <p className="text-gray-400 mt-2">
          Rastreamento de tokens, chamadas e custos de IA
        </p>
      </div>

      {/* Totals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total de Tokens</CardTitle>
            <Brain className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totals.tokens.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Tokens de IA usados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tempo de Chamadas</CardTitle>
            <Clock className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatDuration(totals.callDuration)}</div>
            <p className="text-xs text-gray-500 mt-1">IA + Médico</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total de Exames</CardTitle>
            <FileText className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totals.exams}</div>
            <p className="text-xs text-gray-500 mt-1">Análises realizadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Custo Estimado</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCost(totals.cost)}</div>
            <p className="text-xs text-gray-500 mt-1">Custo total de API</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Usage Table */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-400">Uso Detalhado por Paciente</CardTitle>
          <CardDescription className="text-gray-400">
            {sortedStats.length} pacientes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedStats.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhum dado de uso disponível ainda
              </div>
            ) : (
              sortedStats.map((stat) => (
                <div
                  key={stat.patientId}
                  className="p-4 rounded-lg bg-slate-900/50 border border-cyan-500/10 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{stat.patientName}</h3>
                      <p className="text-sm text-gray-400">{stat.patientEmail}</p>
                    </div>
                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                      {stat.totalTokens.toLocaleString()} tokens
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-400" />
                      <div>
                        <p className="text-xs text-gray-400">Exames</p>
                        <p className="text-sm font-medium text-white">{stat.examAnalysisCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-400">Chamadas IA</p>
                        <p className="text-sm font-medium text-white">{formatDuration(stat.aiCallDuration)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Médico</p>
                        <p className="text-sm font-medium text-white">{formatDuration(stat.doctorCallDuration)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-400" />
                      <div>
                        <p className="text-xs text-gray-400">Custo</p>
                        <p className="text-sm font-medium text-white">{formatCost(stat.totalCost)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown detalhado */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-cyan-400 hover:text-cyan-300">
                      Ver detalhes de uso
                    </summary>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="p-2 rounded bg-slate-950/50">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                          <FileText className="h-3 w-3" />
                          <span className="text-xs">Análise Exames</span>
                        </div>
                        <p className="font-medium text-white">{stat.breakdown.examAnalysis.toLocaleString()} tokens</p>
                      </div>
                      <div className="p-2 rounded bg-slate-950/50">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                          <Mic className="h-3 w-3" />
                          <span className="text-xs">STT</span>
                        </div>
                        <p className="font-medium text-white">{stat.breakdown.stt.toLocaleString()} tokens</p>
                      </div>
                      <div className="p-2 rounded bg-slate-950/50">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                          <Brain className="h-3 w-3" />
                          <span className="text-xs">LLM</span>
                        </div>
                        <p className="font-medium text-white">{stat.breakdown.llm.toLocaleString()} tokens</p>
                      </div>
                      <div className="p-2 rounded bg-slate-950/50">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                          <MessageCircle className="h-3 w-3" />
                          <span className="text-xs">TTS</span>
                        </div>
                        <p className="font-medium text-white">{stat.breakdown.tts.toLocaleString()} tokens</p>
                      </div>
                      <div className="p-2 rounded bg-slate-950/50">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">Chamadas IA</span>
                        </div>
                        <p className="font-medium text-white">{formatDuration(stat.breakdown.aiCall)}</p>
                      </div>
                      <div className="p-2 rounded bg-slate-950/50">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                          <Activity className="h-3 w-3" />
                          <span className="text-xs">Médico</span>
                        </div>
                        <p className="font-medium text-white">{formatDuration(stat.breakdown.doctorCall)}</p>
                      </div>
                      <div className="p-2 rounded bg-slate-950/50">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                          <MessageCircle className="h-3 w-3" />
                          <span className="text-xs">Chat</span>
                        </div>
                        <p className="font-medium text-white">{stat.breakdown.chat.toLocaleString()} tokens</p>
                      </div>
                    </div>
                  </details>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
