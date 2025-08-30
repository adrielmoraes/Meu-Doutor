
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Users, Calendar, History, UserCircle, MessageSquareCode } from "lucide-react";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const DoctorSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { href: "/doctor/patients", label: "Meus Pacientes", icon: <Users /> },
    { href: "/doctor/schedule", label: "Agenda", icon: <Calendar /> },
    { href: "/doctor/history", label: "Histórico", icon: <History /> },
    { href: "/doctor/profile", label: "Meu Perfil", icon: <UserCircle /> },
  ];

  return (
    <SidebarContent className="p-4 flex flex-col">
      <SidebarMenu className="flex-1">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} className="w-full">
              <SidebarMenuButton
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label, side: "right", align: "center" }}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
       <SidebarMenu className="mt-auto">
         <SidebarMenuItem>
           <a href="http://localhost:4000" target="_blank" className="w-full" rel="noopener noreferrer">
             <SidebarMenuButton
                tooltip={{ children: "Logs da IA", side: "right", align: "center" }}
             >
                <MessageSquareCode />
                <span className="truncate">Logs da IA</span>
             </SidebarMenuButton>
           </a>
         </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  );
};

export default DoctorSidebar;
