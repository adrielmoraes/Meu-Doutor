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
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
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
          {emailSent ? (
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
              <Mail className="h-6 w-6" />
            </div>
          )}
          
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-cyan-900 tracking-tight">
            {emailSent ? 'Email Enviado!' : 'Recuperar Senha'}
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm">
            {emailSent 
              ? 'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha com segurança.'
              : 'Digite o email associado à sua conta para receber o link de recuperação.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 sm:px-8 pb-8">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
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
                      <span>Enviando...</span>
                    </>
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed">
                Enviamos as instruções para <strong className="font-semibold text-emerald-950">{email}</strong>. Por favor, verifique também sua pasta de spam ou lixo eletrônico.
              </div>
              <Button 
                onClick={() => setEmailSent(false)} 
                variant="outline" 
                className="w-full py-3 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Tentar outro e-mail
              </Button>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center text-sm font-semibold text-cyan-700 hover:text-cyan-800 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
