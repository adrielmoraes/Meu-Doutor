
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
  LogOut,
  Activity,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logout } from "@/lib/session";
import { useState } from "react";

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/admin/patients', icon: Users },
  { name: 'Médicos', href: '/admin/doctors', icon: Stethoscope },
  { name: 'Exames', href: '/admin/exams', icon: FileText },
  { name: 'Consultas', href: '/admin/consultations', icon: MessageSquare },
  { name: 'Uso de Recursos', href: '/admin/usage', icon: Activity },
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-cyan-500/20 transition-all duration-300 z-50",
        isCollapsed ? "w-0 lg:w-20" : "w-64"
      )}>
        <div className={cn(
          "flex flex-col h-full",
          isCollapsed && "items-center"
        )}>
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-cyan-500/20 px-6">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    MediAI Admin
                  </h1>
                  <p className="text-xs text-gray-400">Painel de Controle</p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <Shield className="h-6 w-6 text-cyan-400 mx-auto" />
            )}
          </div>

          {/* Admin Info */}
          {!isCollapsed && (
            <div className="border-b border-cyan-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{admin.name}</p>
                  <p className="text-xs text-gray-400 truncate">{admin.email}</p>
                </div>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="border-b border-cyan-500/20 p-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

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
                        : "text-gray-400 hover:bg-slate-800 hover:text-cyan-300",
                      isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
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
              className={cn(
                "w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10",
                isCollapsed ? "justify-center px-2" : "justify-start"
              )}
              title={isCollapsed ? "Sair" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <Button
        onClick={() => setIsCollapsed(!isCollapsed)}
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 z-50 bg-slate-900 border border-cyan-500/20 hover:bg-slate-800 hover:border-cyan-500/40 transition-all",
          isCollapsed ? "left-24" : "left-[272px]",
          "lg:block hidden"
        )}
        title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
      >
        {isCollapsed ? <Menu className="h-5 w-5 text-cyan-400" /> : <X className="h-5 w-5 text-cyan-400" />}
      </Button>

      {/* Mobile Toggle Button */}
      <Button
        onClick={() => setIsCollapsed(!isCollapsed)}
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 bg-slate-900 border border-cyan-500/20 hover:bg-slate-800 hover:border-cyan-500/40 lg:hidden"
        title="Menu"
      >
        <Menu className="h-5 w-5 text-cyan-400" />
      </Button>
    </>
  );
}
