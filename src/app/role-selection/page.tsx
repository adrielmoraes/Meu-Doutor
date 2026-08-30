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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden px-4 py-12 selection:bg-cyan-500 selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      <div className="mb-8 z-10">
        <MediAILogo size="lg" />
      </div>

      <div className="relative z-10 bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-900/5 max-w-md w-full">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-cyan-900 mb-2">
          Bem-vindo, {replitUser.replitUserName}!
        </h1>
        <p className="text-center text-slate-600 text-sm mb-8">
          Escolha como deseja usar a plataforma MediAI
        </p>

        <form action={selectRole} className="space-y-4">
          <button
            type="submit"
            name="role"
            value="patient"
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-3"
          >
            <span className="text-2xl">🏥</span>
            <span className="text-base font-bold text-white">Sou Paciente</span>
          </button>

          <button
            type="submit"
            name="role"
            value="doctor"
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-3"
          >
            <span className="text-2xl">👨‍⚕️</span>
            <span className="text-base font-bold text-white">Sou Médico (CRM)</span>
          </button>
        </form>
      </div>
    </div>
  );
}
