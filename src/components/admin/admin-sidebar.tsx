'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  MessageSquare,
  Search,
  Settings,
  Shield,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logout } from "@/lib/session";

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/admin/patients', icon: Users },
  { name: 'Médicos', href: '/admin/doctors', icon: Stethoscope },
  { name: 'Exames', href: '/admin/exams', icon: FileText },
  { name: 'Consultas', href: '/admin/consultations', icon: MessageSquare },
  { name: 'Busca Global', href: '/admin/search', icon: Search },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  admin: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-cyan-500/20">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-cyan-500/20 px-6">
        <Shield className="h-8 w-8 text-cyan-400" />
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            MediAI Admin
          </h1>
          <p className="text-xs text-gray-400">Painel de Controle</p>
        </div>
      </div>

      {/* Admin Info */}
      <div className="border-b border-cyan-500/20 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{admin.name}</p>
            <p className="text-xs text-gray-400 truncate">{admin.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20"
                    : "text-gray-400 hover:bg-slate-800 hover:text-cyan-300"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout Button */}
      <div className="border-t border-cyan-500/20 p-4">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );
}
