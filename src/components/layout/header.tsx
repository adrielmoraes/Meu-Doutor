'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import MediAILogo from "./mediai-logo";
import { useEffect, useState } from 'react';
import { getSessionOnClient, SessionPayload } from '@/lib/session';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { usePathname } from 'next/navigation';
import UserProfileMenu from './user-profile-menu';

const Header = () => {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isAuthDashboard = pathname?.startsWith('/patient') || pathname?.startsWith('/doctor') || pathname?.startsWith('/admin');

  useEffect(() => {
    const fetchSession = async () => {
      const clientSession = await getSessionOnClient();
      setSession(clientSession);
      setLoading(false);
    };
    fetchSession();
  }, []);

  const headerClass = !isAuthDashboard 
    ? "bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm sticky top-0 z-50 transition-all duration-300" 
    : "bg-slate-950/85 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20 sticky top-0 z-50 transition-all duration-300";

  if (loading) {
    return (
      <header className={headerClass}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
              <MediAILogo size="md" />
            </Link>
            <div className="flex items-center gap-4">
              {!isAuthDashboard && (
                <>
                  <Button variant="ghost" asChild className="text-slate-700 hover:text-cyan-900 hover:bg-cyan-50 font-medium">
                    <Link href="/login">Entrar</Link>
                  </Button>
                  <Button asChild className="font-bold bg-cyan-500 hover:bg-cyan-600 text-white shadow-md shadow-cyan-500/20 border-0">
                    <Link href="/register">Registrar-se</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={headerClass}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
            <MediAILogo size="md" />
          </Link>

          {/* Public Navigation Links */}
          {!isAuthDashboard && !session && (
            <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link href="/#como-funciona" className="hover:text-cyan-600 transition-colors">
                Como Funciona
              </Link>
              <Link href="/#especialidades" className="hover:text-cyan-600 transition-colors">
                Especialidades
              </Link>
              <Link href="/pricing" className="hover:text-cyan-600 transition-colors">
                Planos e Preços
              </Link>
              <Link href="/sobre" className="hover:text-cyan-600 transition-colors">
                Sobre Nós
              </Link>
              <Link href="/contato" className="hover:text-cyan-600 transition-colors">
                Contato
              </Link>
            </div>
          )}

          <nav className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              {session ? (
                <UserProfileMenu userId={session.userId} role={session.role} />
              ) : (
                !isAuthDashboard && (
                  <>
                    <Button variant="ghost" asChild className="text-slate-700 hover:text-cyan-900 hover:bg-cyan-50 font-semibold text-sm">
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button asChild className="font-bold bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/25 border-0 text-sm rounded-xl px-5 transition-all transform hover:scale-[1.02]">
                      <Link href="/register">Registrar-se</Link>
                    </Button>
                  </>
                )
              )}
            </div>

            {session && (
              <div className="sm:hidden">
                <UserProfileMenu userId={session.userId} role={session.role} />
              </div>
            )}

            {!session && !isAuthDashboard && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="lg:hidden text-slate-700 hover:text-cyan-950 hover:bg-slate-100 p-2">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[380px] p-6 backdrop-blur-2xl bg-white/95 border-l border-slate-200 text-slate-900">
                  <SheetHeader className="text-left mb-6 mt-4">
                    <SheetTitle className="text-slate-900 flex items-center gap-2">
                      <MediAILogo size="sm" />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-3">
                    <SheetClose asChild>
                      <Link href="/#como-funciona" className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 rounded-xl transition-colors">
                        Como Funciona
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/#especialidades" className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 rounded-xl transition-colors">
                        Especialidades Clínicas
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/pricing" className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 rounded-xl transition-colors">
                        Planos e Preços
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/sobre" className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 rounded-xl transition-colors">
                        Sobre a MediAI
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/contato" className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 rounded-xl transition-colors">
                        Fale Conosco
                      </Link>
                    </SheetClose>
                    
                    <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
                      <SheetClose asChild>
                        <Button variant="outline" asChild className="w-full justify-center text-sm font-bold text-slate-800 border-2 border-slate-300 hover:bg-cyan-50 hover:text-cyan-950 hover:border-cyan-400 bg-white rounded-xl">
                          <Link href="/login">Entrar</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild className="w-full justify-center text-sm font-bold bg-cyan-500 hover:bg-cyan-600 text-white border-0 shadow-md shadow-cyan-500/20 rounded-xl">
                          <Link href="/register">Registrar-se</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
