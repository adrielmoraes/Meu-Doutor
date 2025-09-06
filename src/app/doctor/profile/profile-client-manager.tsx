
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Doctor } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AvatarUpload from '@/components/ui/avatar-upload';
import { uploadAvatarAction, updateDoctorProfile } from './actions';

interface ProfileClientManagerProps {
  doctor: Doctor;
  userId: string;
}

export default function ProfileClientManager({ doctor: initialDoctor, userId }: ProfileClientManagerProps) {
  const [doctor, setDoctor] = useState<Doctor>(initialDoctor);
  const { toast } = useToast();
  const router = useRouter();

  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Chamar a Server Action para atualizar o perfil
    const result = await updateDoctorProfile(formData);

    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.refresh(); // Atualiza a página para buscar os novos dados do servidor
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  };

  const handleUploadComplete = (newUrl: string) => {
    // Atualiza o estado local para refletir a nova imagem imediatamente
    setDoctor({ ...doctor, avatarUrl: newUrl });
    // router.refresh() é chamado dentro da ação de upload, então não é estritamente necessário aqui,
    // mas podemos mantê-lo por segurança para garantir a consistência dos dados.
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna do Avatar e Ações */}
      <div className="lg:col-span-1 flex flex-col items-center">
        <Card className="w-full max-w-sm p-6 text-center">
          <CardHeader className="p-0 mb-4">
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={doctor.avatarUrl || ''}
              fallbackText={doctor.name.substring(0, 1)}
              uploadAction={uploadAvatarAction} // Passando a Server Action como prop
              onUploadComplete={handleUploadComplete}
            />
          </CardHeader>
          <CardContent className="p-0">
            <h2 className="text-2xl font-semibold">Dr(a). {doctor.name}</h2>
            <p className="text-muted-foreground">{doctor.specialty || 'Especialidade não definida'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Coluna de Informações e Formulário */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" defaultValue={doctor.name} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={doctor.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Input id="specialty" name="specialty" defaultValue={doctor.specialty} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={doctor.bio}
                  placeholder="Fale um pouco sobre sua experiência e abordagem profissional."
                  rows={5}
                />
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
