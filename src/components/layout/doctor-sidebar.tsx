'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import MediAILogo from './mediai-logo';
import {
  LayoutDashboard, Users, Calendar, History, Settings, LogOut,
  ChevronLeft, ChevronRight, Stethoscope, Menu, X
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/doctor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/doctor/patients', label: 'Pacientes', icon: Users },
  { href: '/doctor/schedule', label: 'Agenda', icon: Calendar },
  { href: '/doctor/history', label: 'Histórico', icon: History },
  { href: '/doctor/profile', label: 'Perfil', icon: Stethoscope },
  { href: '/doctor/settings', label: 'Configurações', icon: Settings },
];

export default function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-slate-100 shrink-0",
        collapsed ? "justify-center px-2 py-5" : "px-5 py-5"
      )}>
        <MediAILogo size="sm" showText={!collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl transition-all duration-200 group relative",
                "min-h-[44px] min-w-[44px]",
                collapsed ? "justify-center px-3 py-3" : "px-4 py-3",
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200/60"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "h-[20px] w-[20px] shrink-0 transition-transform duration-200",
                active ? "text-white" : "text-slate-400 group-hover:text-slate-700 group-hover:scale-110"
              )} />
              {!collapsed && (
                <span className={cn(
                  "text-[14px] font-semibold truncate",
                  active ? "text-white" : ""
                )}>
                  {item.label}
                </span>
              )}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] shadow-lg pointer-events-none">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 px-3 py-4 space-y-1 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "hidden md:flex items-center gap-3 w-full rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 min-h-[44px]",
            collapsed ? "justify-center px-3 py-3" : "px-4 py-3"
          )}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span className="text-[14px] font-semibold">Recolher</span>}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 min-h-[44px]",
            collapsed ? "justify-center px-3 py-3" : "px-4 py-3"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-[14px] font-semibold">Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white border border-slate-200 shadow-lg rounded-xl p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 text-slate-700" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
        <NavContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-100 transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
