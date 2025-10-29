
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
            <Link href="/">
              <MediAILogo size="md" />
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild className="text-base font-medium text-cyan-300">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild className="text-base font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                <Link href="/register">Registrar-se</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg shadow-cyan-500/5">
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
            {session && (
              <div className="md:hidden">
                <UserProfileMenu userId={session.userId} role={session.role} />
              </div>
            )}
            {!session && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="md:hidden text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                    <Menu className="h-6 w-6" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 bg-slate-800/95 backdrop-blur-xl border-cyan-500/30">
                  <div className="flex flex-col gap-4">
                    <Button variant="ghost" asChild className="justify-start p-0 text-base font-medium text-cyan-300 hover:text-cyan-200">
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button asChild className="text-base font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
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
