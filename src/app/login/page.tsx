
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
      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Acessando...</span>
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#070e24] to-slate-950 text-white relative overflow-hidden px-4 py-12">
      {/* Ambient Lighting Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700 pointer-events-none"></div>
      
      {/* Brand Logo */}
      <div className="mb-8 relative z-10">
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <MediAILogo size="lg" />
        </Link>
      </div>
      
      <Card className="mx-auto max-w-md w-full shadow-2xl bg-slate-900/70 backdrop-blur-2xl border border-white/10 relative z-10 rounded-2xl overflow-hidden">
        {/* Top accent border */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>

        <CardHeader className="space-y-3 pt-8 pb-6 px-6 sm:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">Acesso Seguro</span>
          </div>
          
          <CardTitle className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
            Bem-vindo de volta
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Entre com suas credenciais para acessar sua central de saúde
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 sm:px-8 pb-8">
          <form action={formAction} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                <span>{errorMessage}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-400" />
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                placeholder="seu@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-400" />
                  Senha
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
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
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-950/60 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
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
          
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400">
              Ainda não possui uma conta?{" "}
              <Link 
                href="/register" 
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline transition-colors"
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
