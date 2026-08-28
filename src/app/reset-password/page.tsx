
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MediAILogo from '@/components/layout/mediai-logo';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    if (!token || !type) {
      setIsValidToken(false);
    } else {
      setIsValidToken(true);
    }
  }, [token, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: 'Erro',
        description: 'As senhas não coincidem',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: 'Erro',
        description: 'A senha deve ter no mínimo 6 caracteres',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Senha Redefinida!',
          description: 'Sua senha foi alterada com sucesso.',
          className: "bg-green-100 text-green-800 border-green-200",
        });
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast({
          variant: "destructive",
          title: 'Erro',
          description: data.error || 'Erro ao redefinir senha',
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: 'Erro',
        description: 'Erro ao conectar com o servidor',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#070e24] to-slate-950 text-white relative overflow-hidden px-4 py-12">
        <div className="mb-8 relative z-10 flex justify-center">
          <Link href="/" className="hover:opacity-95 transition-opacity">
            <MediAILogo size="lg" />
          </Link>
        </div>
        <Card className="max-w-md w-full bg-slate-900/70 backdrop-blur-2xl border border-red-500/30 rounded-2xl p-6 shadow-2xl">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <CardTitle className="text-2xl font-bold text-red-400">Link Inválido ou Expirado</CardTitle>
            <CardDescription className="text-slate-400">
              Este link de recuperação é inválido ou já expirou. Solicite um novo link para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-center">
            <Button asChild className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 border-0">
              <Link href="/forgot-password">Solicitar Novo Link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#070e24] to-slate-950 text-white relative overflow-hidden px-4 py-12">
      {/* Ambient Lighting Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700 pointer-events-none"></div>
      
      <div className="mb-8 relative z-10 flex justify-center">
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <MediAILogo size="lg" />
        </Link>
      </div>

      <Card className="mx-auto max-w-md w-full shadow-2xl bg-slate-900/70 backdrop-blur-2xl border border-white/10 relative z-10 rounded-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>

        <CardHeader className="space-y-3 pt-8 pb-6 px-6 sm:px-8">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Lock className="h-6 w-6 text-cyan-400" />
          </div>
          
          <CardTitle className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
            Nova Senha
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Digite sua nova senha abaixo para recuperar seu acesso
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 sm:px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-200">Nova Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-slate-500 rounded-xl"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-slate-500 rounded-xl"
              />
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo senha...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
