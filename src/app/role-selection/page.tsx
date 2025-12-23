import { getReplitUser, mapReplitUserToProfile } from '@/lib/replit-auth';
import { redirect } from 'next/navigation';
import { db } from '../../../server/storage';
import { doctors, patients } from '../../../shared/schema';
import { randomUUID } from 'crypto';
import MediAILogo from '@/components/layout/mediai-logo';

export default async function RoleSelectionPage() {
  const replitUser = await getReplitUser();

  if (!replitUser) {
    redirect('/login');
  }

  if (replitUser.role && replitUser.profileId) {
    if (replitUser.role === 'doctor') {
      redirect('/doctor');
    } else {
      redirect('/patient/dashboard');
    }
  }

  async function selectRole(formData: FormData) {
    'use server';

    const role = formData.get('role') as 'doctor' | 'patient';
    const replitUser = await getReplitUser();

    if (!replitUser) {
      redirect('/login');
    }

    const profileId = randomUUID();

    if (role === 'doctor') {
      await db.insert(doctors).values({
        id: profileId,
        name: replitUser.replitUserName,
        crm: `CRM-${profileId.slice(0, 8)}`,
        specialty: 'Clínico Geral',
        city: 'São Paulo',
        state: 'SP',
        email: `${replitUser.replitUserId}@replit.user`,
        avatar: '👨‍⚕️',
        online: true,
      });
    } else {
      await db.insert(patients).values({
        id: profileId,
        name: replitUser.replitUserName,
        age: 30,
        birthDate: '1994-01-01',
        cpf: replitUser.replitUserId,
        phone: '(11) 99999-9999',
        email: `${replitUser.replitUserId}@replit.user`,
        city: 'São Paulo',
        state: 'SP',
        avatar: '👤',
        gender: 'outro',
      });
    }

    await mapReplitUserToProfile(
      replitUser.replitUserId,
      replitUser.replitUserName,
      role,
      profileId
    );

    if (role === 'doctor') {
      redirect('/doctor');
    } else {
      redirect('/patient/dashboard');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      
      <div className="mb-8 z-10">
        <MediAILogo size="lg" />
      </div>

      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-2">
          Bem-vindo, {replitUser.replitUserName}!
        </h1>
        <p className="text-center text-blue-200/70 mb-8">
          Escolha como deseja usar o MediAI
        </p>

        <form action={selectRole} className="space-y-4">
          <button
            type="submit"
            name="role"
            value="patient"
            className="w-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 text-white py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-3"
          >
            <span className="text-2xl">🏥</span>
            <span className="text-lg font-semibold text-cyan-100">Sou Paciente</span>
          </button>

          <button
            type="submit"
            name="role"
            value="doctor"
            className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/30 text-white py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-3"
          >
            <span className="text-2xl">👨‍⚕️</span>
            <span className="text-lg font-semibold text-purple-100">Sou Médico</span>
          </button>
        </form>
      </div>
    </div>
  );
}
