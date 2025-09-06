
'use client';

import { useState, useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Tipagem para a Server Action
type UploadAction = (formData: FormData) => Promise<{ success: boolean; message: string; url?: string }>;

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string;
  fallbackText: string;
  uploadAction: UploadAction;
  onUploadComplete: (newUrl: string) => void;
}

export default function AvatarUpload({ 
  userId, 
  currentAvatarUrl, 
  fallbackText,
  uploadAction,
  onUploadComplete 
}: AvatarUploadProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
        toast({
            title: 'Erro no Upload',
            description: 'A imagem é muito grande. O tamanho máximo permitido é de 2MB.',
            variant: 'destructive',
        });
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    startTransition(async () => {
      try {
        const result = await uploadAction(formData);

        if (result.success && result.url) {
          toast({ 
            title: 'Sucesso!',
            description: 'Sua foto de perfil foi atualizada.',
          });
          onUploadComplete(result.url);
          setAvatarPreview(null); // Limpa a pré-visualização após o sucesso
        } else {
          toast({ 
            title: 'Erro no Upload',
            description: result.message || 'Não foi possível atualizar a foto de perfil.',
            variant: 'destructive' 
          });
          setAvatarPreview(null); // Limpa a pré-visualização em caso de erro
        }
      } catch (error) {
        console.error('Falha na ação de upload:', error);
        toast({ 
          title: 'Erro Inesperado',
          description: 'Ocorreu um erro de rede ou servidor. Tente novamente.',
          variant: 'destructive' 
        });
        setAvatarPreview(null); // Limpa a pré-visualização em caso de erro
      }
    });
  };

  return (
    <div className="relative group w-32 h-32 mx-auto">
      <Avatar className="w-full h-full text-4xl border-4 border-background group-hover:border-primary transition-colors">
        <AvatarImage src={avatarPreview || currentAvatarUrl} />
        <AvatarFallback>{fallbackText}</AvatarFallback>
      </Avatar>
      <label 
        htmlFor="avatar-upload" 
        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        {isPending ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <Camera className="h-8 w-8" />
        )}
      </label>
      <input
        id="avatar-upload"
        type="file"
        accept="image/png, image/jpeg, image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={isPending}
      />
    </div>
  );
}
