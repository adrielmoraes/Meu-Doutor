'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, LayoutDashboard, Heart, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { logoutAction } from '@/lib/logout-action';
import { useRouter } from 'next/navigation';

interface UserProfileMenuProps {
  userId: string;
  role: 'patient' | 'doctor' | 'admin';
}

interface UserData {
  name: string;
  email: string;
  avatar?: string;
  avatarHint?: string;
}

export default function UserProfileMenu({ userId, role }: UserProfileMenuProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user-profile?userId=${userId}&role=${role}`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, role]);

  const handleLogout = async () => {
    await logoutAction();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-slate-700/50 animate-pulse" />
        <div className="hidden md:block">
          <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const initials = userData?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 px-3 py-2 h-auto hover:bg-cyan-500/10 transition-colors"
        >
          <Avatar className="h-9 w-9 border-2 border-cyan-400/30 ring-2 ring-cyan-500/10">
            <AvatarImage src={userData?.avatar} alt={userData?.name} />
            <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-300 font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-semibold text-slate-100">
              {userData?.name || 'Usuário'}
            </span>
            <span className="text-xs text-slate-400">
              {role === 'patient' ? 'Paciente' : role === 'doctor' ? 'Médico' : 'Administrador'}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 bg-slate-800/95 backdrop-blur-xl border-cyan-500/30 text-slate-100"
        align="end"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-cyan-400/50">
                <AvatarImage src={userData?.avatar} alt={userData?.name} />
                <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-300 text-base font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-cyan-300">{userData?.name || 'Usuário'}</p>
                <p className="text-xs text-slate-400">{userData?.email || ''}</p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-cyan-500/20" />
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-cyan-500/10 focus:bg-cyan-500/10">
          <Link href={role === 'patient' ? '/patient/dashboard' : role === 'doctor' ? '/doctor' : '/admin'} className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-cyan-400" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        {role === 'patient' && (
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-cyan-500/10 focus:bg-cyan-500/10">
            <Link href="/patient/wellness" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-400" />
              <span>Plano de Bem-Estar</span>
            </Link>
          </DropdownMenuItem>
        )}
        {role === 'doctor' && (
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-cyan-500/10 focus:bg-cyan-500/10">
            <Link href="/doctor/patients" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-purple-400" />
              <span>Meus Pacientes</span>
            </Link>
          </DropdownMenuItem>
        )}
        {role !== 'admin' && (
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-cyan-500/10 focus:bg-cyan-500/10">
            <Link href={`/${role}/profile`} className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-400" />
              <span>Configurações</span>
            </Link>
          </DropdownMenuItem>
        )}
        {role === 'admin' && (
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-cyan-500/10 focus:bg-cyan-500/10">
            <Link href="/admin/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-400" />
              <span>Configurações</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-cyan-500/20" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-400 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
