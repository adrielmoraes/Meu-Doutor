
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Patient } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AvatarUpload from '@/components/ui/avatar-upload';
// Importa as novas Server Actions específicas para o paciente
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
      toast({ title: "Sucesso!", description: result.message });
      router.refresh(); // Atualiza a página para buscar os novos dados do servidor
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  };

  const handleUploadComplete = (newUrl: string) => {
    setPatient({ ...patient, avatarUrl: newUrl });
    router.refresh();
    toast({ title: "Avatar Atualizado!", description: "Sua nova foto de perfil foi salva com sucesso." });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna do Avatar */}
      <div className="lg:col-span-1 flex flex-col items-center">
        <Card className="w-full max-w-sm p-6 text-center">
          <CardHeader className="p-0 mb-4">
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={patient.avatarUrl || ''}
              fallbackText={patient.name.substring(0, 1)}
              uploadAction={uploadPatientAvatarAction} // Usando a ação de upload do paciente
              onUploadComplete={handleUploadComplete}
            />
          </CardHeader>
          <CardContent className="p-0">
            <h2 className="text-2xl font-semibold">{patient.name}</h2>
            <p className="text-muted-foreground">Paciente</p>
          </CardContent>
        </Card>
      </div>

      {/* Coluna de Informações e Formulário */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Minhas Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={patient.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" name="name" defaultValue={patient.name} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" name="city" defaultValue={patient.city} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" name="state" defaultValue={patient.state} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Salvar Alterações</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
