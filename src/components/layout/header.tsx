
'use client';

import Link from "next/link";
import { Brain, Infinity, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { getSessionOnClient, SessionPayload } from '@/lib/session';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Menu } from "lucide-react";
import { usePathname } from 'next/navigation';

const Header = () => {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const fetchSession = async () => {
      const clientSession = await getSessionOnClient();
      setSession(clientSession);
      setLoading(false);
    };
    fetchSession();
  }, []);

  if (loading) {
    return (
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg shadow-cyan-500/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-cyan-400" />
              <Infinity className="h-8 w-8 text-cyan-400" />
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                MediAI
              </span>
            </Link>
            <div className="h-8 w-32 animate-pulse bg-slate-700/50 rounded"></div> 
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg shadow-cyan-500/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Brain className="h-8 w-8 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            <Infinity className="h-8 w-8 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-blue-300 transition-all">
              MediAI
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link href="/#features" className="text-base font-medium text-blue-200/70 hover:text-cyan-300 transition-colors">
                Recursos
              </Link>
              <Link href="/pricing" className="text-base font-medium text-blue-200/70 hover:text-cyan-300 transition-colors">
                Preços
              </Link>
              <Link href="/#demo" className="text-base font-medium text-blue-200/70 hover:text-cyan-300 transition-colors">
                Demo
              </Link>
              {!isHome && session ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="text-blue-200 hover:text-cyan-300 hover:bg-cyan-500/10">
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4 bg-slate-800 border-cyan-500/30 text-white">
                    <div className="space-y-2">
                      <h4 className="font-medium text-cyan-300">Perfil do Usuário</h4>
                      <p className="text-sm text-blue-200/70">ID do Usuário: {session?.userId}</p>
                      <p className="text-sm text-blue-200/70">Função: {session?.role === 'patient' ? 'Paciente' : 'Médico'}</p>
                      <Button variant="outline" asChild className="w-full border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-300">
                        <Link href={session.role === 'patient' ? '/patient/dashboard' : '/doctor'}>
                          Ir para Meu Portal
                        </Link>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-base font-medium text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10">
                    <Link href="/login">Entrar</Link>
                  </Button>
                  <Button asChild className="text-base font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20 transition-all">
                    <Link href="/register">Registrar-se</Link>
                  </Button>
                </>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="md:hidden text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                  <Menu className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 bg-slate-800/95 backdrop-blur-xl border-cyan-500/30">
                <div className="flex flex-col gap-4">
                  <Link href="/#features" className="text-base font-medium text-blue-200/70 hover:text-cyan-300">
                    Recursos
                  </Link>
                  <Link href="/pricing" className="text-base font-medium text-blue-200/70 hover:text-cyan-300">
                    Preços
                  </Link>
                  <Link href="/#demo" className="text-base font-medium text-blue-200/70 hover:text-cyan-300">
                    Demo
                  </Link>
                  {!isHome && session ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="justify-start p-0 text-blue-200 hover:text-cyan-300">
                          <User className="mr-2 h-4 w-4" />
                          Perfil
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4 bg-slate-800 border-cyan-500/30 text-white">
                        <div className="space-y-2">
                          <h4 className="font-medium text-cyan-300">Perfil do Usuário</h4>
                          <p className="text-sm text-blue-200/70">ID do Usuário: {session?.userId}</p>
                          <p className="text-sm text-blue-200/70">Função: {session?.role === 'patient' ? 'Paciente' : 'Médico'}</p>
                          <Button variant="outline" asChild className="w-full border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-300">
                            <Link href={session.role === 'patient' ? '/patient/dashboard' : '/doctor'}>
                              Ir para Meu Portal
                            </Link>
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <>
                      <Button variant="ghost" asChild className="justify-start p-0 text-base font-medium text-cyan-300 hover:text-cyan-200">
                        <Link href="/login">Entrar</Link>
                      </Button>
                      <Button asChild className="text-base font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                        <Link href="/register">Registrar-se</Link>
                      </Button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
