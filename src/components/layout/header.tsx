
'use client'; // Torna este um Client Component

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
      <header className="bg-card shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <Infinity className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight text-foreground">
                MediAI
              </span>
            </Link>
            <div className="h-8 w-32 animate-pulse bg-muted rounded"></div> 
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-card shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <Infinity className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              MediAI
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link href="/#features" className="text-base font-medium text-foreground/80 hover:text-foreground">
                Recursos
              </Link>
              <Link href="/#tech" className="text-base font-medium text-foreground/80 hover:text-foreground">
                Tecnologia
              </Link>
              <Link href="/#demo" className="text-base font-medium text-foreground/80 hover:text-foreground">
                Demo
              </Link>
              {!isHome && session ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost">
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Perfil do Usuário</h4>
                      <p className="text-sm">ID do Usuário: {session?.userId}</p>
                      <p className="text-sm">Função: {session?.role === 'patient' ? 'Paciente' : 'Médico'}</p>
                      <Button variant="outline" asChild className="w-full">
                        <Link href={session.role === 'patient' ? '/patient/dashboard' : '/doctor'}>
                          Ir para Meu Portal
                        </Link>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-base font-medium bg-[#ea339e] hover:bg-[#d12b8d] text-white">
                    <Link href="/login">Entrar</Link>
                  </Button>
                  <Button asChild className="text-base font-medium bg-[#ea339e] hover:bg-[#d12b8d] text-white">
                    <Link href="/register">Registrar-se</Link>
                  </Button>
                </>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex flex-col gap-4">
                  <Link href="/#features" className="text-base font-medium text-foreground/80 hover:text-foreground">
                    Recursos
                  </Link>
                  <Link href="/#tech" className="text-base font-medium text-foreground/80 hover:text-foreground">
                    Tecnologia
                  </Link>
                  <Link href="/#demo" className="text-base font-medium text-foreground/80 hover:text-foreground">
                    Demo
                  </Link>
                  {!isHome && session ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="justify-start p-0">
                          <User className="mr-2 h-4 w-4" />
                          Perfil
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Perfil do Usuário</h4>
                          <p className="text-sm">ID do Usuário: {session?.userId}</p>
                          <p className="text-sm">Função: {session?.role === 'patient' ? 'Paciente' : 'Médico'}</p>
                          <Button variant="outline" asChild className="w-full">
                            <Link href={session.role === 'patient' ? '/patient/dashboard' : '/doctor'}>
                              Ir para Meu Portal
                            </Link>
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <>
                      <Button variant="ghost" asChild className="justify-start p-0 text-base font-medium bg-[#ea339e] hover:bg-[#d12b8d] text-white">
                        <Link href="/login">Entrar</Link>
                      </Button>
                      <Button asChild className="text-base font-medium bg-[#ea339e] hover:bg-[#d12b8d] text-white">
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
