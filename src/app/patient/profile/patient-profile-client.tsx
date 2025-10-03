
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Patient } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, MapPin } from 'lucide-react';
import AvatarUpload from '@/components/ui/avatar-upload';
import { uploadPatientAvatarAction, updatePatientProfile } from './actions';

interface PatientProfileClientProps {
  patient: Patient;
  userId: string;
}

export default function PatientProfileClient({ patient: initialPatient, userId }: PatientProfileClientProps) {
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const { toast } = useToast();
  const router = useRouter();

  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const result = await updatePatientProfile(formData);

    if (result.success) {
      toast({ 
        title: "Sucesso!", 
        description: result.message,
        className: "bg-green-100 text-green-800 border-green-200"
      });
      router.refresh();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  };

  const handleUploadComplete = (newUrl: string) => {
    setPatient({ ...patient, avatar: newUrl });
    router.refresh();
    toast({ 
      title: "Avatar Atualizado!", 
      description: "Sua nova foto de perfil foi salva com sucesso.",
      className: "bg-green-100 text-green-800 border-green-200"
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna do Avatar */}
      <div className="lg:col-span-1 flex flex-col items-center">
        <Card className="w-full max-w-sm bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
          <CardHeader className="p-6 pb-4">
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={patient.avatar || ''}
              fallbackText={patient.name.substring(0, 1)}
              uploadAction={uploadPatientAvatarAction}
              onUploadComplete={handleUploadComplete}
            />
          </CardHeader>
          <CardContent className="p-6 pt-2 text-center">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              {patient.name}
            </h2>
            <p className="text-blue-200/70 mt-1">Paciente</p>
          </CardContent>
        </Card>
      </div>

      {/* Coluna de Informações e Formulário */}
      <div className="lg:col-span-2">
        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
              <User className="h-6 w-6" />
              Minhas Informações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-100 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  Email
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={patient.email} 
                  disabled 
                  className="bg-slate-900/50 border-cyan-500/30 text-blue-100/50 cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-blue-100 flex items-center gap-2">
                  <User className="h-4 w-4 text-cyan-400" />
                  Nome Completo
                </Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={patient.name}
                  className="bg-slate-900/50 border-cyan-500/30 focus:border-cyan-500 text-white"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-blue-100 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    Cidade
                  </Label>
                  <Input 
                    id="city" 
                    name="city" 
                    defaultValue={patient.city}
                    className="bg-slate-900/50 border-cyan-500/30 focus:border-cyan-500 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-blue-100">Estado</Label>
                  <Input 
                    id="state" 
                    name="state" 
                    defaultValue={patient.state}
                    className="bg-slate-900/50 border-cyan-500/30 focus:border-cyan-500 text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
