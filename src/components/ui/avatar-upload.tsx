
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AvatarUploadProps = {
  currentAvatarUrl: string | null;
  fallbackText: string;
  onUploadSuccess?: (newUrl: string) => void;
};

export default function AvatarUpload({ currentAvatarUrl, fallbackText, onUploadSuccess }: AvatarUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(currentAvatarUrl);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast({
        variant: "destructive",
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione uma imagem para fazer upload.',
      });
      return;
    }

    setIsLoading(true);
    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Sucesso!',
          description: data.message,
          className: "bg-green-100 text-green-800 border-green-200",
        });
        if (onUploadSuccess) {
          onUploadSuccess(data.fileUrl);
        }
        setPreviewUrl(data.fileUrl); // Atualiza a preview com a URL final
      } else {
        throw new Error(data.message || 'Falha no upload do arquivo.');
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: 'Erro no Upload',
        description: error.message || 'Ocorreu um erro inesperado durante o upload.',
      });
      setPreviewUrl(currentAvatarUrl); // Reverte para a URL atual em caso de erro
    } finally {
      setIsLoading(false);
      // Resetar o input de arquivo para permitir upload do mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32 border-4 border-primary shadow-md">
        <AvatarImage src={previewUrl || undefined} alt="Avatar" />
        <AvatarFallback className="text-xl font-semibold bg-primary/20 text-primary-foreground">
          {fallbackText}
        </AvatarFallback>
      </Avatar>
      <div className="flex gap-2">
        <Input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="sr-only" // Esconder o input file padrão
        />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isLoading}>
          <Camera className="mr-2 h-4 w-4" /> Selecionar Imagem
        </Button>
        <Button onClick={handleUpload} disabled={isLoading || !fileInputRef.current?.files?.[0]}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <UploadCloud className="mr-2 h-4 w-4" /> Upload
        </Button>
      </div>
       {previewUrl && previewUrl !== currentAvatarUrl && (
        <p className="text-sm text-muted-foreground mt-2">Nova imagem selecionada. Clique em Upload para salvar.</p>
      )}
    </div>
  );
}
