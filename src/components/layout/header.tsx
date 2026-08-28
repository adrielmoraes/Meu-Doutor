
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import MediAILogo from "./mediai-logo";
import { useEffect, useState } from 'react';
import { getSessionOnClient, SessionPayload } from '@/lib/session';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Menu } from "lucide-react";
import { usePathname } from 'next/navigation';
import UserProfileMenu from './user-profile-menu';

const Header = () => {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/patient') || pathname?.startsWith('/doctor') || pathname?.startsWith('/admin');

  useEffect(() => {
    const fetchSession = async () => {
      const clientSession = await getSessionOnClient();
      setSession(clientSession);
      setLoading(false);
    };
    fetchSession();
  }, []);

  const headerClass = "bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20 sticky top-0 z-50 transition-all duration-300";

  if (loading) {
    return (
      <header className={headerClass}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
              <MediAILogo size="md" />
            </Link>
            <nav className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4">
                {!isAuthRoute && (
                  <>
                    <Button variant="ghost" asChild className="text-slate-200 hover:text-white hover:bg-white/10 font-medium">
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button asChild className="font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 border-0 transition-all hover:scale-105 active:scale-95">
                      <Link href="/register">Registrar-se</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={headerClass}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
            <MediAILogo size="md" />
          </Link>
          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <UserProfileMenu userId={session.userId} role={session.role} />
              ) : (
                !isAuthRoute && (
                  <>
                    <Button variant="ghost" asChild className="text-slate-200 hover:text-white hover:bg-white/10 font-medium">
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button asChild className="font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 border-0 transition-all hover:scale-105 active:scale-95">
                      <Link href="/register">Registrar-se</Link>
                    </Button>
                  </>
                )
              )}
            </div>
            {session && (
              <div className="md:hidden">
                <UserProfileMenu userId={session.userId} role={session.role} />
              </div>
            )}
            {!session && !isAuthRoute && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="md:hidden text-slate-200 hover:text-white hover:bg-white/10">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] p-6 backdrop-blur-2xl bg-slate-950/95 border-l border-white/10 text-white">
                  <SheetHeader className="text-left mb-6 mt-4">
                    <SheetTitle className="text-white flex items-center gap-2">
                      <MediAILogo size="sm" />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4">
                    <SheetClose asChild>
                      <Button variant="outline" asChild className="w-full justify-start text-base font-medium text-slate-200 border-white/10 hover:text-white hover:bg-white/10 bg-slate-900/50">
                        <Link href="/login">Entrar</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="w-full justify-start text-base font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-cyan-500/20">
                        <Link href="/register">Registrar-se</Link>
                      </Button>
                    </SheetClose>
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
