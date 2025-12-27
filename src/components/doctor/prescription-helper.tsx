"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PrescriptionHelperProps {
  onAdd: (text: string) => void;
}

export default function PrescriptionHelper({ onAdd }: PrescriptionHelperProps) {
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (!medication) return;

    const prescriptionText = `\nPRESCRICÃO:\n- ${medication} ${dosage}\n  Tomar ${frequency} por ${duration}.`;
    onAdd(prescriptionText);
    
    // Reset form
    setMedication("");
    setDosage("");
    setFrequency("");
    setDuration("");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs border-dashed border-slate-600 bg-slate-800/50 hover:bg-slate-800 text-blue-300">
          <Pill className="h-3 w-3 mr-1" />
          Nova Prescrição
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-slate-900 border-slate-700 p-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-slate-200 leading-none">Adicionar Medicamento</h4>
            <p className="text-xs text-slate-500">Gera um texto formatado de prescrição.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="medication" className="text-xs text-slate-400">Nome</Label>
              <Input
                id="medication"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                className="col-span-2 h-8 bg-slate-800 border-slate-700 text-xs"
                placeholder="Ex: Amoxicilina"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="dosage" className="text-xs text-slate-400">Dosagem</Label>
              <Input
                id="dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="col-span-2 h-8 bg-slate-800 border-slate-700 text-xs"
                placeholder="Ex: 500mg"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="frequency" className="text-xs text-slate-400">Frequência</Label>
              <Input
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="col-span-2 h-8 bg-slate-800 border-slate-700 text-xs"
                placeholder="Ex: 8/8h"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="duration" className="text-xs text-slate-400">Duração</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="col-span-2 h-8 bg-slate-800 border-slate-700 text-xs"
                placeholder="Ex: 7 dias"
              />
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-3 w-3 mr-1" />
            Inserir na Nota
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
