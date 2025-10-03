
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
    setDoctor({ ...doctor, avatarUrl: newUrl });
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
        <Card className="w-full max-w-sm bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10">
          <CardHeader className="p-6 pb-4">
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={doctor.avatarUrl || ''}
              fallbackText={doctor.name.substring(0, 1)}
              uploadAction={uploadAvatarAction}
              onUploadComplete={handleUploadComplete}
            />
          </CardHeader>
          <CardContent className="p-6 pt-2 text-center">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Dr(a). {doctor.name}
            </h2>
            <p className="text-blue-200/70 mt-1">{doctor.specialty || 'Especialidade não definida'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Coluna de Informações e Formulário */}
      <div className="lg:col-span-2">
        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-purple-300 flex items-center gap-2">
              <User className="h-6 w-6" />
              Informações do Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-blue-100 flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-400" />
                  Nome Completo
                </Label>
                <Input 
                  id="name" 
                  defaultValue={doctor.name} 
                  disabled 
                  className="bg-slate-900/50 border-purple-500/30 text-blue-100/50 cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-100 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-400" />
                  Email
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={doctor.email} 
                  disabled 
                  className="bg-slate-900/50 border-purple-500/30 text-blue-100/50 cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-blue-100 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-purple-400" />
                  Especialidade
                </Label>
                <Input 
                  id="specialty" 
                  name="specialty" 
                  defaultValue={doctor.specialty}
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-blue-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-400" />
                  Biografia
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={doctor.bio}
                  placeholder="Fale um pouco sobre sua experiência e abordagem profissional."
                  rows={5}
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                />
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all"
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
