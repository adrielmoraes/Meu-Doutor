
'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  const authContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/__replauthuser');
        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.id) {
            window.location.href = '/role-selection';
          }
        }
      } catch (error) {
        console.log('Não autenticado, mostrando botão de login');
      }
    };

    checkAuth();

    // Carregar o script do Replit Auth
    if (authContainerRef.current && !authContainerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://auth.util.repl.co/script.js';
      script.setAttribute('authed', 'window.location.href="/role-selection"');
      script.async = true;
      authContainerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      
      <Card className="mx-auto max-w-sm w-full shadow-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 relative z-10">
        <CardHeader className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Bem-vindo ao MediAI</span>
          </div>
          
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Login Seguro
          </CardTitle>
          <CardDescription className="text-blue-200/70">
            Faça login com sua conta Replit para continuar
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div 
              ref={authContainerRef}
              id="replit-auth-container"
              className="min-h-[60px] flex items-center justify-center"
            >
              <div className="text-blue-200/50 text-sm">
                Carregando autenticação...
              </div>
            </div>
            
            <p className="mt-6 text-sm text-blue-200/50 text-center">
              Autenticação segura via Replit
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
