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
        <Button variant="outline" size="sm" className="h-7 text-xs border-dashed border-slate-300 bg-white hover:bg-slate-50 text-blue-600 shadow-sm">
          <Pill className="h-3 w-3 mr-1" />
          Nova Prescrição
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-white border-slate-200 p-4 shadow-xl">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 leading-none">Adicionar Medicamento</h4>
            <p className="text-xs text-slate-500">Gera um texto formatado de prescrição.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="medication" className="text-xs text-slate-600 font-semibold">Nome</Label>
              <Input
                id="medication"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                className="col-span-2 h-8 bg-white border-slate-200 text-xs focus:ring-blue-500"
                placeholder="Ex: Amoxicilina"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="dosage" className="text-xs text-slate-600 font-semibold">Dosagem</Label>
              <Input
                id="dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="col-span-2 h-8 bg-white border-slate-200 text-xs focus:ring-blue-500"
                placeholder="Ex: 500mg"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="frequency" className="text-xs text-slate-600 font-semibold">Frequência</Label>
              <Input
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="col-span-2 h-8 bg-white border-slate-200 text-xs focus:ring-blue-500"
                placeholder="Ex: 8/8h"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="duration" className="text-xs text-slate-600 font-semibold">Duração</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="col-span-2 h-8 bg-white border-slate-200 text-xs focus:ring-blue-500"
                placeholder="Ex: 7 dias"
              />
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
            <Plus className="h-3 w-3 mr-1" />
            Inserir na Nota
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
