
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
import { User, Mail, Stethoscope, FileText } from 'lucide-react';
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

    const result = await updateDoctorProfile(formData);

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
    setDoctor({ ...doctor, avatar: newUrl });
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
        <Card className="w-full max-w-sm bg-white border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <CardHeader className="p-8 pb-4 flex flex-col items-center bg-slate-50/50">
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={doctor.avatar || ''}
              fallbackText={doctor.name.substring(0, 1)}
              uploadAction={uploadAvatarAction}
              onUploadComplete={handleUploadComplete}
            />
          </CardHeader>
          <CardContent className="p-8 pt-6 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Dr(a). {doctor.name}
            </h2>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
              {doctor.specialty || 'Clínico Geral'}
            </div>
            <p className="text-slate-500 mt-4 text-sm leading-relaxed italic">
              "Dedicado à excelência no cuidado ao paciente através da inovação digital."
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coluna de Informações e Formulário */}
      <div className="lg:col-span-2">
        <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="border-b border-slate-50 p-8">
            <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              Informações do Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleProfileUpdate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    defaultValue={doctor.name}
                    disabled
                    className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-bold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={doctor.email}
                    disabled
                    className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-slate-700 font-bold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-500" />
                  Especialidade
                </Label>
                <Input
                  id="specialty"
                  name="specialty"
                  defaultValue={doctor.specialty}
                  className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-900 font-medium h-11"
                  placeholder="Ex: Cardiologia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-slate-700 font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Biografia Profissional
                </Label>
                <div className="relative group">
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={(doctor as any).bio || ''}
                    placeholder="Fale um pouco sobre sua experiência, formação e abordagem profissional."
                    rows={5}
                    className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 font-medium resize-none leading-relaxed p-4"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-50">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-6 h-auto shadow-md shadow-blue-100 transition-all rounded-xl"
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
