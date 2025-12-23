
'use client';

import { useState } from 'react';
import { TrendingUp, ShieldAlert, Target, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GenerateHealthInsightsOutput } from "@/ai/flows/generate-health-insights";
import { Button } from '../ui/button';

type HealthGoalsPanelProps = {
  insights: GenerateHealthInsightsOutput;
};

export default function HealthGoalsPanel({ insights }: HealthGoalsPanelProps) {
  // We manage the goals' progress in the client-side state for immediate visual feedback.
  const [goals, setGoals] = useState(insights.healthGoals);

  const handleProgressUpdate = (goalTitle: string) => {
    setGoals(currentGoals => 
      currentGoals.map(goal => {
        if (goal.title === goalTitle) {
          // Increase progress by 10%, but not exceeding 100%
          const newProgress = Math.min(goal.progress + 10, 100);
          return { ...goal, progress: newProgress };
        }
        return goal;
      })
    );
  };

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
              <li key={index}>{alert.alert}</li>
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
            {goals.map((goal) => (
              <div key={goal.title}>
                <div className="flex justify-between items-center mb-1">
                  <p className="font-medium text-sm">{goal.title}</p>
                   <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{goal.progress}%</p>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6" 
                        onClick={() => handleProgressUpdate(goal.title)}
                        aria-label={`Registrar progresso para ${goal.title}`}
                      >
                        <PlusCircle className="h-4 w-4 text-green-600" />
                      </Button>
                   </div>
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
