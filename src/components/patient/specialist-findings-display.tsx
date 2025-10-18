"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Stethoscope, 
  Brain, 
  Eye, 
  Pill, 
  Users, 
  Activity,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type SpecialistFinding = {
  specialist: string;
  findings: string;
  clinicalAssessment: string;
  recommendations: string;
};

interface SpecialistFindingsDisplayProps {
  findings: SpecialistFinding[];
}

// Mapa de especialistas para ícones e cores
const specialistConfig: Record<string, { icon: any; color: string; bgColor: string; borderColor: string }> = {
  'Cardiologista': { 
    icon: Heart, 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
  'Pneumologista': { 
    icon: Activity, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  'Radiologista': { 
    icon: Eye, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  'Neurologista': { 
    icon: Brain, 
    color: 'text-pink-400', 
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30'
  },
  'Gastroenterologista': { 
    icon: Stethoscope, 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  },
  'Endocrinologista': { 
    icon: Pill, 
    color: 'text-teal-400', 
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30'
  },
  'Dermatologista': { 
    icon: User, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  'Ortopedista': { 
    icon: Activity, 
    color: 'text-lime-400', 
    bgColor: 'bg-lime-500/10',
    borderColor: 'border-lime-500/30'
  },
  'Oftalmologista': { 
    icon: Eye, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30'
  },
  'Otorrinolaringologista': { 
    icon: User, 
    color: 'text-indigo-400', 
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30'
  },
  'Nutricionista': { 
    icon: Users, 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  'Pediatra': { 
    icon: Heart, 
    color: 'text-rose-400', 
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30'
  },
  'Ginecologista': { 
    icon: Heart, 
    color: 'text-fuchsia-400', 
    bgColor: 'bg-fuchsia-500/10',
    borderColor: 'border-fuchsia-500/30'
  },
  'Urologista': { 
    icon: Activity, 
    color: 'text-sky-400', 
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30'
  },
  'Psiquiatra': { 
    icon: Brain, 
    color: 'text-violet-400', 
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30'
  },
};

// Configuração de gravidade
const severityConfig: Record<string, { icon: any; color: string; label: string }> = {
  'normal': { 
    icon: CheckCircle, 
    color: 'text-green-400', 
    label: 'Normal' 
  },
  'mild': { 
    icon: AlertCircle, 
    color: 'text-blue-400', 
    label: 'Leve' 
  },
  'moderate': { 
    icon: AlertTriangle, 
    color: 'text-yellow-400', 
    label: 'Moderado' 
  },
  'severe': { 
    icon: XCircle, 
    color: 'text-orange-400', 
    label: 'Grave' 
  },
  'critical': { 
    icon: XCircle, 
    color: 'text-red-400', 
    label: 'Crítico' 
  },
  'not applicable': { 
    icon: AlertCircle, 
    color: 'text-gray-400', 
    label: 'Não Aplicável' 
  },
};

function SpecialistCard({ finding }: { finding: SpecialistFinding }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Extrair o nome da especialidade do campo specialist (ex: "Dra. Ana (Cardiologista)" -> "Cardiologista")
  const specialtyMatch = finding.specialist.match(/\(([^)]+)\)/);
  const specialty = specialtyMatch ? specialtyMatch[1] : 'Médico';
  
  const config = specialistConfig[specialty] || {
    icon: User,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30'
  };
  
  const Icon = config.icon;
  
  // Normalizar clinicalAssessment para minúsculas
  const assessmentKey = finding.clinicalAssessment.toLowerCase();
  const severityInfo = severityConfig[assessmentKey] || severityConfig['not applicable'];
  const SeverityIcon = severityInfo.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`border ${config.borderColor} ${config.bgColor} backdrop-blur-sm transition-all hover:shadow-lg`}>
        <CollapsibleTrigger className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-base text-slate-200">{finding.specialist}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <SeverityIcon className={`h-4 w-4 ${severityInfo.color}`} />
                    <span className={`text-sm ${severityInfo.color}`}>
                      {severityInfo.label}
                    </span>
                  </div>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-4">
            {/* Achados Clínicos */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                <h5 className="font-semibold text-sm text-cyan-300">Achados Clínicos</h5>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-cyan-500/30">
                {finding.findings}
              </p>
            </div>

            {/* Recomendações */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h5 className="font-semibold text-sm text-amber-300">Recomendações</h5>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-amber-500/30">
                {finding.recommendations}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function SpecialistFindingsDisplay({ findings }: SpecialistFindingsDisplayProps) {
  if (!findings || findings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Users className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-xl text-purple-100">Equipe de Especialistas Consultados</h3>
            <p className="text-sm text-purple-300 mt-1">
              {findings.length} {findings.length === 1 ? 'especialista analisou' : 'especialistas analisaram'} seu exame em paralelo
            </p>
          </div>
        </div>
        
        {/* Badges dos Especialistas */}
        <div className="flex flex-wrap gap-2 mt-4">
          {findings.map((finding, index) => {
            const specialtyMatch = finding.specialist.match(/\(([^)]+)\)/);
            const specialty = specialtyMatch ? specialtyMatch[1] : 'Médico';
            const config = specialistConfig[specialty] || { 
              icon: User, 
              color: 'text-gray-400', 
              bgColor: 'bg-gray-500/10' 
            };
            const Icon = config.icon;
            
            return (
              <Badge 
                key={index} 
                variant="outline" 
                className={`${config.bgColor} ${config.borderColor} border backdrop-blur-sm px-3 py-1.5`}
              >
                <Icon className={`h-3.5 w-3.5 ${config.color} mr-1.5`} />
                <span className="text-slate-200 text-xs">{specialty}</span>
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Specialist Cards */}
      <div className="space-y-3">
        {findings.map((finding, index) => (
          <SpecialistCard key={index} finding={finding} />
        ))}
      </div>
    </div>
  );
}
