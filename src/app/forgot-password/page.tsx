
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      
      <div className="mb-8 relative z-10 flex justify-center">
        <MediAILogo size="lg" />
      </div>

      <Card className="mx-auto max-w-md w-full shadow-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 relative z-10">
        <CardHeader className="space-y-4">
          {emailSent ? (
            <div className="flex justify-center">
              <CheckCircle className="h-14 w-14 text-green-400" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Mail className="h-7 w-7 text-cyan-400" />
            </div>
          )}
          
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            {emailSent ? 'Email Enviado!' : 'Recuperar Senha'}
          </CardTitle>
          <CardDescription className="text-blue-200/70">
            {emailSent 
              ? 'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.'
              : 'Digite seu email para receber instruções de recuperação'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-100">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-slate-900/50 border-cyan-500/30 focus:border-cyan-500 text-white placeholder:text-slate-500"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
            </form>
          ) : (
            <Button 
              asChild
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
            >
              <Link href="/login">
                Voltar para Login
              </Link>
            </Button>
          )}
          
          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
