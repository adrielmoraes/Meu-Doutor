
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import MediAILogo from '@/components/layout/mediai-logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast({
          title: 'Email Enviado!',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
          className: "bg-green-100 text-green-800 border-green-200",
        });
      } else {
        toast({
          variant: "destructive",
          title: 'Erro',
          description: data.error || 'Erro ao enviar email de recuperação',
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
          {emailSent ? (
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Mail className="h-6 w-6 text-cyan-400" />
            </div>
          )}
          
          <CardTitle className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
            {emailSent ? 'Email Enviado!' : 'Recuperar Senha'}
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            {emailSent 
              ? 'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha com segurança.'
              : 'Digite o email associado à sua conta para receber o link de recuperação.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 sm:px-8 pb-8">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-200">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
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
                      Enviando instruções...
                    </>
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <Button 
              asChild
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-cyan-500/25 border-0"
            >
              <Link href="/login">
                Voltar para Login
              </Link>
            </Button>
          )}
          
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link 
              href="/login" 
              className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
