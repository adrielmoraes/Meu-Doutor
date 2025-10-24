import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getAdminById, getPatients, getDoctors, getExams, getConsultations } from "@/lib/db-adapter";
import { SecuritySettings } from "@/components/admin/settings/security-settings";
import { DatabaseSettings } from "@/components/admin/settings/database-settings";
import { NotificationSettings } from "@/components/admin/settings/notification-settings";
import { GeneralSettings } from "@/components/admin/settings/general-settings";

export default async function AdminSettingsPage() {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const admin = await getAdminById(session.userId);
  
  if (!admin) {
    redirect('/login');
  }

  // Buscar estatísticas do banco de dados
  const [patients, doctors, exams, consultations] = await Promise.all([
    getPatients(),
    getDoctors(),
    getExams(),
    getConsultations(),
  ]);

  const dbStats = {
    totalPatients: patients.length,
    totalDoctors: doctors.length,
    totalExams: exams.length,
    totalConsultations: consultations.length,
    pendingPatients: patients.filter((p: any) => p.status === 'Requer Validação').length,
    verifiedPatients: patients.filter((p: any) => p.emailVerified).length,
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Configurações
        </h1>
        <p className="text-gray-400 mt-2">
          Gerencie as configurações da plataforma
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segurança */}
        <SecuritySettings admin={admin} />

        {/* Banco de Dados */}
        <DatabaseSettings stats={dbStats} />

        {/* Notificações */}
        <NotificationSettings />

        {/* Geral */}
        <GeneralSettings />
      </div>
    </div>
  );
}
