
"use client";

import { AlertTriangle, Pill, Activity, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PatientSafetyBarProps {
  preventiveAlerts?: string[];
  // Futuramente, podemos ter campos dedicados para alergias e meds no banco
  // Por enquanto, vamos simular ou extrair de notas se disponível
  allergies?: string[];
  activeConditions?: string[];
}

export default function PatientSafetyBar({
  preventiveAlerts = [],
  allergies = [],
  activeConditions = []
}: PatientSafetyBarProps) {

  // Se não houver nada crítico, não ocupa espaço desnecessário
  const hasContent = preventiveAlerts.length > 0 || allergies.length > 0 || activeConditions.length > 0;
  if (!hasContent) return null;

  return (
    <Card className="bg-rose-50/50 border-rose-100 mb-6 shadow-sm overflow-hidden">
      <CardContent className="p-4 flex flex-col md:flex-row gap-6 items-start md:items-center">

        {/* Seção de Alergias (Crítico) */}
        {allergies.length > 0 ? (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="bg-rose-100 p-2 rounded-full">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Alergias</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {allergies.map((allergy, idx) => (
                  <Badge key={idx} variant="destructive" className="text-[10px] h-5 px-2 bg-rose-600 hover:bg-rose-700">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Placeholder visual se não tiver alergias registradas, para o médico saber que foi checado
          <div className="flex items-center gap-3 opacity-60">
            <ShieldAlert className="h-5 w-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Sem alergias registradas</span>
          </div>
        )}

        <div className="h-8 w-px bg-rose-200 hidden md:block" />

        {/* Alertas Preventivos (Do banco de dados) */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-amber-600" />
            <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Alertas Clínicos & Comorbidades
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {preventiveAlerts.map((alert, idx) => (
              <TooltipProvider key={idx}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 shadow-sm">
                      <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
                      {alert}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Alerta preventivo identificado pelo sistema</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {activeConditions.map((cond, idx) => (
              <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                {cond}
              </Badge>
            ))}
            {preventiveAlerts.length === 0 && activeConditions.length === 0 && (
              <span className="text-xs text-slate-400 italic">Nenhum alerta clínico ativo.</span>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
