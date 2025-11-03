import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getAdminById } from "@/lib/db-adapter";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const admin = await getAdminById(session.userId);
  
  if (!admin) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <AdminSidebar admin={admin} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
