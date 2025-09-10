
'use client'; // Torna este um Client Component

import Link from "next/link";
import { Stethoscope, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react'; // Importar useEffect e useState
import { getSessionOnClient, SessionPayload } from '@/lib/session'; // Importar getSessionOnClient e SessionPayload
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const Header = () => {
  const [session, setSession] = useState<SessionPayload | null>(null); // Estado para a sessão
  const [loading, setLoading] = useState(true); // Estado para o carregamento da sessão

  useEffect(() => {
    const fetchSession = async () => {
      const clientSession = await getSessionOnClient();
      setSession(clientSession);
      setLoading(false);
    };
    fetchSession();
  }, []); // Executar apenas uma vez no carregamento do componente

  // Se ainda estiver carregando, podemos renderizar um placeholder ou nada
  if (loading) {
    return (
      <header className="bg-card shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Stethoscope className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight text-foreground">
                MediAI
              </span>
            </Link>
            {/* Placeholder ou spinner enquanto carrega */}
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
            <Stethoscope className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              MediAI
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            {/* Renderizar links condicionalmente */}
            {!session ? (
              <></>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
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
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
