'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toggleWeeklyTaskAction } from './wellness-actions';
import { useToast } from '@/hooks/use-toast';
import { Apple, Dumbbell as DumbbellIcon, Brain, CheckCircle2 } from 'lucide-react';

interface WeeklyTask {
  id: string;
  category: 'nutrition' | 'exercise' | 'mental' | 'general';
  title: string;
  description: string;
  dayOfWeek?: string;
  completed: boolean;
  completedAt?: string;
}

interface WeeklyTasksSectionProps {
  patientId: string;
  tasks: WeeklyTask[];
}

const categoryConfig = {
  nutrition: {
    label: 'Nutrição',
    icon: Apple,
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-500/10 to-emerald-600/10',
    borderColor: 'border-green-500/30',
  },
  exercise: {
    label: 'Exercícios',
    icon: DumbbellIcon,
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-500/10 to-red-600/10',
    borderColor: 'border-orange-500/30',
  },
  mental: {
    label: 'Bem-Estar Mental',
    icon: Brain,
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-500/10 to-pink-600/10',
    borderColor: 'border-purple-500/30',
  },
  general: {
    label: 'Geral',
    icon: CheckCircle2,
    gradient: 'from-blue-500 to-cyan-600',
    bgGradient: 'from-blue-500/10 to-cyan-600/10',
    borderColor: 'border-blue-500/30',
  },
};

export default function WeeklyTasksSection({ patientId, tasks }: WeeklyTasksSectionProps) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const { toast } = useToast();

  const completedCount = localTasks.filter(task => task.completed).length;
  const totalCount = localTasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    setLocalTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, completed: newStatus, completedAt: newStatus ? new Date().toISOString() : undefined }
          : task
      )
    );

    const result = await toggleWeeklyTaskAction(patientId, taskId, newStatus);
    
    if (!result.success) {
      setLocalTasks(tasks);
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.message,
      });
    } else if (newStatus) {
      toast({
        title: "Parabéns! 🎉",
        description: "Tarefa concluída com sucesso!",
        className: "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-800 dark:text-green-100",
      });
    }
  };

  const groupedTasks = localTasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, WeeklyTask[]>);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-2 border-primary/30 bg-card/80 backdrop-blur-sm p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5" />
        
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Progresso Semanal
            </h3>
            <div className="text-lg font-semibold">
              <span className="text-primary">{completedCount}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{totalCount}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className="h-3"
            />
            <p className="text-sm text-muted-foreground text-center">
              {progressPercentage === 100 
                ? "🎉 Você completou todas as tarefas da semana!" 
                : `${Math.round(progressPercentage)}% concluído - Continue assim!`}
            </p>
          </div>
        </div>
      </Card>

      {Object.entries(groupedTasks).map(([category, categoryTasks]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig];
        const CategoryIcon = config.icon;
        
        return (
          <Card
            key={category}
            className={`relative overflow-hidden border-2 ${config.borderColor} bg-card/80 backdrop-blur-sm p-6`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5" />
            
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                  <CategoryIcon className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">
                  {config.label}
                </h4>
                <span className="ml-auto text-sm text-muted-foreground">
                  {categoryTasks.filter(t => t.completed).length}/{categoryTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {categoryTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-4 rounded-lg bg-muted/30 border-2 border-border/50 transition-all hover:border-border ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <Checkbox
                      id={task.id}
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                      className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    
                    <div className="flex-1 space-y-1">
                      <label
                        htmlFor={task.id}
                        className={`block font-medium cursor-pointer ${
                          task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </label>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      {task.dayOfWeek && (
                        <span className="inline-block mt-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary border-2 border-primary/30">
                          {task.dayOfWeek}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })}

      {totalCount === 0 && (
        <Card className="border-2 border-border/50 bg-card/60 p-8 text-center">
          <p className="text-muted-foreground">
            Suas tarefas semanais serão geradas assim que você tiver exames analisados.
          </p>
        </Card>
      )}
    </div>
  );
}
