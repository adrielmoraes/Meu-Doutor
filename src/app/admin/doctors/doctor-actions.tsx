'use client';

import { Button } from "@/components/ui/button";
import { Check, X, Loader2, FileText, AlertTriangle } from "lucide-react";
import { approveDoctorAction, rejectDoctorAction } from "./actions";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DoctorApprovalActions({ doctorId, documentUrl }: { doctorId: string; documentUrl?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await approveDoctorAction(doctorId);
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
          className: "bg-green-100 text-green-800 border-green-200",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        variant: "destructive",
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da rejeição.",
      });
      return;
    }
    
    setLoading(true);
    try {
      const result = await rejectDoctorAction(doctorId, rejectReason);
      if (result.success) {
        toast({
          title: "Médico Rejeitado",
          description: result.message,
        });
        setIsRejectOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {documentUrl && (
        <Button
          size="sm"
          variant="outline"
          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
          onClick={() => window.open(documentUrl, '_blank')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Ver Documento
        </Button>
      )}

      <Button
        size="sm"
        onClick={handleApprove}
        disabled={loading}
        className="bg-green-500 hover:bg-green-600 text-white"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
        Aprovar
      </Button>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
            Rejeitar
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" /> Rejeitar Cadastro
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Esta ação irá remover o cadastro do médico e enviar um e-mail notificando a rejeição.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason" className="text-slate-200">Motivo da Rejeição</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Documento ilegível, CRM não encontrado na base oficial..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)} className="text-slate-400 hover:text-white">Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
