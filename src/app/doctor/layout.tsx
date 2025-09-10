
import DoctorSidebar from "@/components/layout/doctor-sidebar";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { getSession } from "@/lib/session"; // Importar getSession
import { redirect } from "next/navigation";
import { updateDoctorStatus } from '@/lib/firestore-admin-adapter'; // Importar a função de atualização

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Redirecionar se não for médico ou não estiver logado
  if (!session || session.role !== 'doctor' || !session.userId) {
    redirect('/login');
  }

  // Atualizar o status do médico para online no Firestore
  // Isso será executado em cada requisição para uma rota de doutor
  try {
    await updateDoctorStatus(session.userId, true); // Definir como online
  } catch (e) {
    console.error("Failed to update doctor status to online:", e);
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="bg-card border-r">
            <div className="flex h-16 items-center justify-between p-4 border-b">
                <Link href="/doctor" className="flex items-center gap-2">
                    <Stethoscope className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
                    MediAI
                    </span>
                </Link>
            </div>
            <DoctorSidebar />
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <header className="flex h-16 items-center justify-between px-6 border-b bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl font-semibold">Painel do Médico</h1>
            </div>
             {/* Can add user profile dropdown here */}
          </header>
          <SidebarInset>
            <main className="flex-1 p-4 sm:p-6 lg:p-8" style={{ background: 'linear-gradient(to right, #edb6d9, #f2f3ef)' }}>
                {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
