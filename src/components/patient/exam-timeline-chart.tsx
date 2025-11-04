'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Exam } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ExamTimelineChartProps {
  exams: Exam[];
  examType: string;
  color: string;
  icon: React.ReactNode;
}

export function ExamTimelineChart({ exams, examType, color, icon }: ExamTimelineChartProps) {
  const sortedExams = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartData = sortedExams.map((exam, index) => ({
    date: format(new Date(exam.date), 'dd/MMM', { locale: ptBR }),
    fullDate: format(new Date(exam.date), 'dd/MM/yyyy', { locale: ptBR }),
    value: index + 1,
    diagnosis: exam.status === 'Validado' && exam.finalExplanation 
      ? exam.finalExplanation 
      : exam.preliminaryDiagnosis,
    status: exam.status,
    result: exam.result,
    examId: exam.id
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-primary/30 rounded-lg p-4 shadow-xl">
          <p className="text-foreground font-semibold mb-2">{data.fullDate}</p>
          <Badge 
            variant={data.status === 'Validado' ? 'default' : 'secondary'}
            className="mb-2"
          >
            {data.status}
          </Badge>
          <p className="text-foreground text-sm mb-1">
            <span className="font-medium">Resultado:</span> {data.result}
          </p>
          <p className="text-muted-foreground text-xs mt-2 max-w-xs line-clamp-3">
            {data.diagnosis}
          </p>
        </div>
      );
    }
    return null;
  };

  if (sortedExams.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 sm:p-2 rounded-lg bg-gradient-to-br ${color}`}>
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {examType}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {sortedExams.length} {sortedExams.length === 1 ? 'exame realizado' : 'exames realizados'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${examType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color.includes('cyan') ? '#06b6d4' : color.includes('purple') ? '#a855f7' : '#3b82f6'} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color.includes('cyan') ? '#06b6d4' : color.includes('purple') ? '#a855f7' : '#3b82f6'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              className="stroke-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              className="stroke-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              label={{ value: 'Exames', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color.includes('cyan') ? '#06b6d4' : color.includes('purple') ? '#a855f7' : '#3b82f6'}
              strokeWidth={3}
              dot={{ fill: color.includes('cyan') ? '#06b6d4' : color.includes('purple') ? '#a855f7' : '#3b82f6', r: 6 }}
              activeDot={{ r: 8, fill: color.includes('cyan') ? '#22d3ee' : color.includes('purple') ? '#c084fc' : '#60a5fa' }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
          {sortedExams.map((exam) => (
            <Badge 
              key={exam.id} 
              variant={exam.status === 'Validado' ? 'default' : 'secondary'}
              className="text-xs px-2 py-0.5"
            >
              {format(new Date(exam.date), 'dd/MMM', { locale: ptBR })}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
