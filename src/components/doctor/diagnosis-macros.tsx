"use client";

import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  FileCheck,
  AlertTriangle,
  Pill,
  Stethoscope,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DiagnosisMacrosProps {
  onInsert: (text: string) => void;
}

export default function DiagnosisMacros({ onInsert }: DiagnosisMacrosProps) {
  const macros = [
    {
      category: "Geral",
      items: [
        { label: "Quadro Estável", text: "Paciente apresenta quadro clínico estável, sem novas queixas." },
        { label: "Dentro da Normalidade", text: "Exames analisados encontram-se dentro dos limites da normalidade para a faixa etária." },
        { label: "Melhora Clínica", text: "Paciente evoluindo com melhora significativa dos sintomas relatados." },
      ]
    },
    {
      category: "Conduta",
      items: [
        { label: "Manter Conduta", text: "Opto por manter a conduta terapêutica atual e reavaliar em breve." },
        { label: "Ajuste de Dose", text: "Necessário ajuste de dosagem da medicação em uso devido aos resultados apresentados." },
        { label: "Novos Exames", text: "Solicito novos exames complementares para melhor elucidação diagnóstica." },
      ]
    },
    {
      category: "Retorno",
      items: [
        { label: "Retorno 30 dias", text: "Retorno agendado para reavaliação em 30 dias." },
        { label: "Retorno 6 meses", text: "Seguimento semestral recomendado." },
        { label: "Alta Médica", text: "Paciente recebe alta do episódio atual, mantendo orientações preventivas." },
      ]
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-600 shadow-sm">
            <Plus className="h-3 w-3 mr-1" />
            Modelos Rápidos
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white border-slate-200 text-slate-700 shadow-lg">
          {macros.map((category, idx) => (
            <div key={category.category}>
              {idx > 0 && <DropdownMenuSeparator className="bg-slate-100" />}
              <DropdownMenuLabel className="text-blue-600 text-[10px] uppercase tracking-wider font-bold">{category.category}</DropdownMenuLabel>
              {category.items.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  onClick={() => onInsert(item.text)}
                  className="cursor-pointer focus:bg-blue-50 focus:text-blue-700 font-medium"
                >
                  <span className="truncate">{item.label}</span>
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Access Buttons */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-medium"
        onClick={() => onInsert("Exames normais. Manter orientações de estilo de vida.")}
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        Normal
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-medium"
        onClick={() => onInsert("Atenção aos valores alterados. Recomendado repetir exame em 30 dias.")}
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        Alerta
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 font-medium"
        onClick={() => onInsert("Manter medicação vigente.")}
      >
        <Pill className="h-3 w-3 mr-1" />
        Manter Medicação
      </Button>
    </div>
  );
}
