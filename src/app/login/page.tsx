'use client';

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Eye, EyeOff, Loader2, Lock, Mail, ArrowRight } from 'lucide-react';
import { loginAction } from './actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MediAILogo from '@/components/layout/mediai-logo';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Acessando sua conta...</span>
        </>
      ) : (
        <>
          <span>Entrar no Sistema</span>
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction] = useActionState(loginAction, { message: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success && state?.redirectPath) {
      router.push(state.redirectPath);
    } else if (state?.message) {
      setErrorMessage(state.message);
    }
  }, [state, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden px-4 py-12 selection:bg-cyan-500 selection:text-white">
      {/* Ambient Lighting Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* Brand Logo */}
      <div className="mb-8 relative z-10">
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <MediAILogo size="lg" />
        </Link>
      </div>
      
      <Card className="mx-auto max-w-md w-full shadow-2xl bg-white border border-slate-200 relative z-10 rounded-3xl overflow-hidden shadow-slate-900/5">
        {/* Top accent border */}
        <div className="h-1.5 bg-cyan-500 w-full"></div>

        <CardHeader className="space-y-3 pt-8 pb-4 px-6 sm:px-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 w-fit">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
            <span className="text-xs text-cyan-900 font-semibold uppercase tracking-wider">Acesso Seguro</span>
          </div>
          
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-cyan-900 tracking-tight">
            Bem-vindo de volta
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm">
            Entre com suas credenciais para acessar sua central de saúde
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 sm:px-8 pb-8">
          <form action={formAction} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                <span>{errorMessage}</span>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-600" />
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                placeholder="seu@email.com"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-cyan-600" />
                  Senha
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Ainda não possui uma conta?{" "}
              <Link 
                href="/register" 
                className="text-cyan-700 hover:text-cyan-800 font-bold transition-colors"
              >
                Cadastre-se gratuitamente
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
