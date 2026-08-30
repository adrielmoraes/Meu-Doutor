'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden px-4 py-12 selection:bg-cyan-500 selection:text-white">
        <div className="mb-8 relative z-10 flex justify-center">
          <Link href="/" className="hover:opacity-95 transition-opacity">
            <MediAILogo size="lg" />
          </Link>
        </div>
        <Card className="max-w-md w-full bg-white border border-red-200 rounded-3xl p-6 shadow-xl shadow-slate-900/5">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <CardTitle className="text-2xl font-bold text-red-600">Link Inválido ou Expirado</CardTitle>
            <CardDescription className="text-slate-600">
              Este link de recuperação é inválido ou já expirou. Solicite um novo link para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-center">
            <Button asChild className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-500/25 border-0">
              <Link href="/forgot-password">Solicitar Novo Link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden px-4 py-12 selection:bg-cyan-500 selection:text-white">
      {/* Ambient Lighting Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      <div className="mb-8 relative z-10 flex justify-center">
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <MediAILogo size="lg" />
        </Link>
      </div>

      <Card className="mx-auto max-w-md w-full shadow-2xl bg-white border border-slate-200 relative z-10 rounded-3xl overflow-hidden shadow-slate-900/5">
        {/* Top accent bar */}
        <div className="h-1.5 bg-cyan-500 w-full"></div>

        <CardHeader className="space-y-3 pt-8 pb-4 px-6 sm:px-8 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
            <Lock className="h-6 w-6" />
          </div>
          
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-cyan-900 tracking-tight">
            Criar Nova Senha
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm">
            Digite sua nova senha abaixo para recuperar seu acesso
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 sm:px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Nova Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl"
              />
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Redefinindo senha...</span>
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600">Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
