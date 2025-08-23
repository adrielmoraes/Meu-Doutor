'use client';

import { TrendingUp, ShieldAlert, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GenerateHealthInsightsOutput } from "@/ai/flows/generate-health-insights";

type HealthGoalsPanelProps = {
  insights: GenerateHealthInsightsOutput;
};

export default function HealthGoalsPanel({ insights }: HealthGoalsPanelProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <TrendingUp className="h-6 w-6 text-primary" />
          Painel de Saúde Preventiva e Metas
        </CardTitle>
        <CardDescription>
          Seus insights gerados por IA para um futuro mais saudável.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        {/* Preventive Alerts Section */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Oportunidades de Prevenção
          </h3>
          <ul className="space-y-2 list-disc pl-5 text-sm text-muted-foreground">
            {insights.preventiveAlerts.map((alert, index) => (
              <li key={index}>{alert}</li>
            ))}
          </ul>
        </div>

        {/* Health Goals Section */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Suas Metas de Saúde
          </h3>
          <div className="space-y-4">
            {insights.healthGoals.map((goal) => (
              <div key={goal.title}>
                <div className="flex justify-between items-center mb-1">
                  <p className="font-medium text-sm">{goal.title}</p>
                  <p className="text-sm font-bold">{goal.progress}%</p>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
