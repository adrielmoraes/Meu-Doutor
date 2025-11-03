'use client';

import { Menu, LogOut, User, Mail, Phone, MapPin, Activity, CreditCard } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/patient/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent hidden sm:block">
              MediAI
            </span>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all"
              >
                <Avatar className="h-8 w-8 border-2 border-cyan-500/30">
                  <AvatarImage src={patient.avatar} alt={patient.name} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm">
                    {getInitials(patient.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-gray-200">
                  {patient.name.split(' ')[0]}
                </span>
                <Menu className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-80 bg-slate-900/95 backdrop-blur-xl border-cyan-500/30"
            >
              {/* User Info Section */}
              <DropdownMenuLabel className="pb-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-14 w-14 border-2 border-cyan-500/40">
                    <AvatarImage src={patient.avatar} alt={patient.name} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-lg">
                      {getInitials(patient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-semibold text-gray-100 leading-tight">
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

              <DropdownMenuSeparator className="bg-cyan-500/20" />

              {/* Patient Details */}
              <div className="px-2 py-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  <span className="truncate">{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Phone className="h-4 w-4 text-cyan-400" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  <span>{patient.city}, {patient.state}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span>Idade: {patient.age} anos</span>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-cyan-500/20" />

              {/* Action Items */}
              <Link href="/patient/profile">
                <DropdownMenuItem className="cursor-pointer hover:bg-cyan-500/10 focus:bg-cyan-500/10">
                  <User className="mr-2 h-4 w-4 text-cyan-400" />
                  <span className="text-gray-200">Meu Perfil</span>
                </DropdownMenuItem>
              </Link>

              <Link href="/patient/subscription">
                <DropdownMenuItem className="cursor-pointer hover:bg-cyan-500/10 focus:bg-cyan-500/10">
                  <CreditCard className="mr-2 h-4 w-4 text-cyan-400" />
                  <span className="text-gray-200">Assinatura</span>
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator className="bg-cyan-500/20" />

              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
