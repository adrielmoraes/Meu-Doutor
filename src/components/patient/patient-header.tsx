'use client';

import { Menu, LogOut, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Patient } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import MediAILogo from '@/components/layout/mediai-logo';

interface PatientHeaderProps {
  patient: Patient;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/patient/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <MediAILogo size="md" showText={true} />
          </Link>

          {/* Theme Toggle and User Menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all"
              >
                <Avatar className="h-8 w-8 border-2 border-primary/30">
                  <AvatarImage src={patient.avatar} alt={patient.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm">
                    {getInitials(patient.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-foreground">
                  {patient.name.split(' ')[0]}
                </span>
                <Menu className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-80 bg-popover/95 backdrop-blur-xl border-border"
            >
              {/* User Info Section */}
              <DropdownMenuLabel className="pb-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-14 w-14 border-2 border-primary/40">
                    <AvatarImage src={patient.avatar} alt={patient.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg">
                      {getInitials(patient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-semibold text-popover-foreground leading-tight">
                      {patient.name}
                    </p>
                    <Badge 
                      variant={patient.status === 'Validado' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {patient.status}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-border" />

              {/* Patient Details */}
              <div className="px-2 py-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="truncate">{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{patient.city}, {patient.state}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 text-primary" />
                  <span>Idade: {patient.age} anos</span>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-border" />

              {/* Action Items */}
              <Link href="/patient/profile">
                <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10">
                  <User className="mr-2 h-4 w-4 text-primary" />
                  <span className="text-popover-foreground">Meu Perfil</span>
                </DropdownMenuItem>
              </Link>

              <Link href="/patient/subscription">
                <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10">
                  <CreditCard className="mr-2 h-4 w-4 text-primary" />
                  <span className="text-popover-foreground">Assinatura</span>
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}