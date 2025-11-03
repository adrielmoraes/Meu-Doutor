import { getReplitUser, mapReplitUserToProfile } from '@/lib/replit-auth';
import { redirect } from 'next/navigation';
import { db } from '../../../server/storage';
import { doctors, patients } from '../../../shared/schema';
import { randomUUID } from 'crypto';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Bem-vindo, {replitUser.replitUserName}!
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Escolha como deseja usar o MediAI
        </p>

        <form action={selectRole} className="space-y-4">
          <button
            type="submit"
            name="role"
            value="patient"
            className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span className="text-2xl">🏥</span>
            <span className="text-lg font-semibold">Sou Paciente</span>
          </button>

          <button
            type="submit"
            name="role"
            value="doctor"
            className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span className="text-2xl">👨‍⚕️</span>
            <span className="text-lg font-semibold">Sou Médico</span>
          </button>
        </form>
      </div>
    </div>
  );
}
