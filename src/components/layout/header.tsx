
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import MediAILogo from "./mediai-logo";
import { useEffect, useState } from 'react';
import { getSessionOnClient, SessionPayload } from '@/lib/session';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Menu } from "lucide-react";
import { usePathname } from 'next/navigation';
import UserProfileMenu from './user-profile-menu';

const Header = () => {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isPricing = pathname === '/pricing';
  const isDarkHeader = isHome || isPricing;
  const isAuthRoute = pathname?.startsWith('/patient') || pathname?.startsWith('/doctor');

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
      <header className={`backdrop-blur-xl border-b shadow-sm transition-colors duration-300 ${
        isDarkHeader 
          ? "bg-slate-950/80 border-slate-800/50" 
          : "bg-[#fce7f5]/80 border-pink-200/50 dark:bg-slate-950/80 dark:border-slate-800/50"
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/">
              <MediAILogo size="md" />
            </Link>
            <nav className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6">
                {!isAuthRoute && (
                  <>
                    <Button variant="ghost" asChild className={`text-base font-medium ${
                      isDarkHeader 
                        ? "text-slate-300 hover:text-white hover:bg-slate-800/50" 
                        : "text-slate-700 hover:text-slate-900 hover:bg-pink-200/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50"
                    }`}>
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button asChild className="text-base font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20 transition-all border-0">
                      <Link href="/register">Registrar-se</Link>
                    </Button>
                  </>
                )}
              </div>
              {!isAuthRoute && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className={`md:hidden ${
                      isDarkHeader 
                        ? "text-slate-300 hover:text-white hover:bg-slate-800/50" 
                        : "text-slate-700 hover:text-slate-900 hover:bg-pink-200/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50"
                    }`}>
                      <Menu className="h-6 w-6" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className={`w-64 p-4 backdrop-blur-xl ${
                    isDarkHeader 
                      ? "bg-slate-900/95 border-slate-800" 
                      : "bg-[#fce7f5]/95 border-pink-200 dark:bg-slate-900/95 dark:border-slate-800"
                  }`}>
                    <div className="flex flex-col gap-4">
                      <Button variant="ghost" asChild className={`justify-start p-0 text-base font-medium ${
                        isDarkHeader 
                          ? "text-slate-300 hover:text-white" 
                          : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                      }`}>
                        <Link href="/login">Entrar</Link>
                      </Button>
                      <Button asChild className="text-base font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                        <Link href="/register">Registrar-se</Link>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`backdrop-blur-xl border-b shadow-sm transition-colors duration-300 ${
      isDarkHeader 
        ? "bg-slate-950/80 border-slate-800/50" 
        : "bg-[#fce7f5]/80 border-pink-200/50 dark:bg-slate-950/80 dark:border-slate-800/50"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <MediAILogo size="md" />
          </Link>
          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              {session ? (
                <UserProfileMenu userId={session.userId} role={session.role} />
              ) : (
                !isAuthRoute && (
                  <>
                    <Button variant="ghost" asChild className={`text-base font-medium ${
                      isDarkHeader 
                        ? "text-slate-300 hover:text-white hover:bg-slate-800/50" 
                        : "text-slate-700 hover:text-slate-900 hover:bg-pink-200/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50"
                    }`}>
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button asChild className="text-base font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20 transition-all border-0">
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className={`md:hidden ${
                    isDarkHeader 
                      ? "text-slate-300 hover:text-white hover:bg-slate-800/50" 
                      : "text-slate-700 hover:text-slate-900 hover:bg-pink-200/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50"
                  }`}>
                    <Menu className="h-6 w-6" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={`w-64 p-4 backdrop-blur-xl ${
                  isDarkHeader 
                    ? "bg-slate-900/95 border-slate-800" 
                    : "bg-[#fce7f5]/95 border-pink-200 dark:bg-slate-900/95 dark:border-slate-800"
                }`}>
                  <div className="flex flex-col gap-4">
                    <Button variant="ghost" asChild className={`justify-start p-0 text-base font-medium ${
                      isDarkHeader 
                        ? "text-slate-300 hover:text-white" 
                        : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    }`}>
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button asChild className="text-base font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                      <Link href="/register">Registrar-se</Link>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
