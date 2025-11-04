'use client';

import React, { useMemo } from 'react';
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

function extractNumericValue(valueStr: string): number | null {
  const match = valueStr.match(/[\d.,]+/);
  if (!match) return null;
  const numStr = match[0].replace(',', '.');
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

interface ParameterData {
  [parameterName: string]: {
    data: Array<{
      date: string;
      fullDate: string;
      value: number;
      valueStr: string;
      reference: string;
    }>;
    unit: string;
  };
}

export function ExamTimelineChart({ exams, examType, color, icon }: ExamTimelineChartProps) {
  const sortedExams = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const parameterData = useMemo(() => {
    const grouped: ParameterData = {};
    
    sortedExams.forEach((exam) => {
      if (!exam.results || exam.results.length === 0) return;
      
      exam.results.forEach((result) => {
        const numericValue = extractNumericValue(result.value);
        if (numericValue === null) return;
        
        const unit = result.value.replace(/[\d.,\s]+/, '').trim();
        
        if (!grouped[result.name]) {
          grouped[result.name] = {
            data: [],
            unit: unit
          };
        }
        
        grouped[result.name].data.push({
          date: format(new Date(exam.date), 'dd/MMM', { locale: ptBR }),
          fullDate: format(new Date(exam.date), 'dd/MM/yyyy', { locale: ptBR }),
          value: numericValue,
          valueStr: result.value,
          reference: result.reference
        });
      });
    });
    
    return grouped;
  }, [sortedExams]);

  const CustomTooltip = ({ active, payload, paramName }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border-2 border-primary/30 rounded-lg p-3 shadow-xl">
          <p className="text-foreground font-semibold text-sm mb-1">{data.fullDate}</p>
          <p className="text-primary font-bold text-base">
            {data.valueStr}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Ref: {data.reference}
          </p>
        </div>
      );
    }
    return null;
  };

  if (sortedExams.length === 0) {
    return null;
  }

  const parameters = Object.keys(parameterData);
  
  if (parameters.length === 0) {
    return null;
  }

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];

  return (
    <div className="space-y-6">
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
        <CardContent className="p-3 sm:p-6 space-y-6">
          {parameters.map((paramName, index) => {
            const paramColor = colors[index % colors.length];
            const chartData = parameterData[paramName].data;
            const unit = parameterData[paramName].unit;
            
            return (
              <div key={paramName} className="border-2 border-border/40 rounded-lg p-3 sm:p-4 bg-muted/20">
                <h4 className="text-sm sm:text-base font-semibold text-foreground mb-1">
                  {paramName}
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {chartData.length} {chartData.length === 1 ? 'medição' : 'medições'}
                </p>
                
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      className="stroke-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis 
                      className="stroke-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      label={{ 
                        value: unit || 'Valor', 
                        angle: -90, 
                        position: 'insideLeft', 
                        fill: 'hsl(var(--muted-foreground))',
                        style: { fontSize: 11 }
                      }}
                    />
                    <Tooltip content={(props) => <CustomTooltip {...props} paramName={paramName} />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={paramColor}
                      strokeWidth={2.5}
                      dot={{ fill: paramColor, r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: paramColor }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {chartData.map((point, idx) => (
                    <Badge 
                      key={idx}
                      variant="outline"
                      className="text-xs px-2 py-0.5 border-2"
                      style={{ borderColor: paramColor + '40', color: paramColor }}
                    >
                      {point.date}: {point.valueStr}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
