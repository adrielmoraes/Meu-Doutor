"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Users, Calendar, History, Bot } from "lucide-react";
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
  ];

  return (
    <SidebarContent className="p-4">
      <SidebarMenu>
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
    </SidebarContent>
  );
};

export default DoctorSidebar;
