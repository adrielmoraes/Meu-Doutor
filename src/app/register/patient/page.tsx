'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { createPatientAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MediAILogo from '@/components/layout/mediai-logo';

export default function PatientRegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const initialState = { message: null, errors: null, success: false };
  const [state, dispatch] = useActionState(createPatientAction, initialState);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!state) return;

    if (state.success && state.message) {
      toast({
        title: 'Cadastro Realizado!',
        description: state.message,
        className: "bg-emerald-50 text-emerald-800 border-emerald-200",
        duration: 8000,
      });
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else if (state.message && !state.success) {
      toast({
        variant: "destructive",
        title: 'Erro no Cadastro',
        description: state.message,
      });
    }
  }, [state, toast, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden px-4 py-12 selection:bg-cyan-500 selection:text-white">
      {/* Background Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="mb-8 relative z-10 flex justify-center">
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <MediAILogo size="lg" />
        </Link>
      </div>

      <Card className="mx-auto max-w-lg w-full shadow-2xl bg-white border border-slate-200 relative z-10 rounded-3xl overflow-hidden shadow-slate-900/5">
        {/* Top accent bar */}
        <div className="h-1.5 bg-cyan-500 w-full"></div>

        <CardHeader className="space-y-3 pt-8 pb-4 px-6 sm:px-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 w-fit">
            <User className="h-4 w-4 text-cyan-600" />
            <span className="text-xs text-cyan-900 font-semibold uppercase tracking-wider">Conta de Paciente</span>
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-cyan-900 tracking-tight">
            Cadastro de Paciente
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm">
            Preencha seus dados para acessar análises inteligentes e seu prontuário
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-8">
          <form action={dispatch}>
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Nome Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                />
                {state?.errors?.fullName && <p className="text-xs text-red-500">{state.errors.fullName[0]}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                />
                {state?.errors?.email && <p className="text-xs text-red-500">{state.errors.email[0]}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cpf" className="text-sm font-medium text-slate-700">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    required
                    className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                  />
                  {state?.errors?.cpf && <p className="text-xs text-red-500">{state.errors.cpf[0]}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="birthDate" className="text-sm font-medium text-slate-700">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    required
                    className="bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500 rounded-xl"
                  />
                  {state?.errors?.birthDate && <p className="text-xs text-red-500">{state.errors.birthDate[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    required
                    className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                  />
                  {state?.errors?.phone && <p className="text-xs text-red-500">{state.errors.phone[0]}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-sm font-medium text-slate-700">Gênero</Label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                  {state?.errors?.gender && <p className="text-xs text-red-500">{state.errors.gender[0]}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mothersName" className="text-sm font-medium text-slate-700">Nome da Mãe</Label>
                <Input
                  id="mothersName"
                  name="mothersName"
                  type="text"
                  placeholder="Nome completo da mãe"
                  required
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                />
                {state?.errors?.mothersName && <p className="text-xs text-red-500">{state.errors.mothersName[0]}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="city" className="text-sm font-medium text-slate-700">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Sua cidade"
                    required
                    className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                  />
                  {state?.errors?.city && <p className="text-xs text-red-500">{state.errors.city[0]}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-sm font-medium text-slate-700">UF</Label>
                  <Input
                    id="state"
                    name="state"
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    required
                    className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl uppercase text-center"
                  />
                  {state?.errors?.state && <p className="text-xs text-red-500">{state.errors.state[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="bg-slate-50 border-slate-300 text-slate-900 pr-10 rounded-xl focus:border-cyan-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {state?.errors?.password && <p className="text-xs text-red-500">{state.errors.password[0]}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="bg-slate-50 border-slate-300 text-slate-900 pr-10 rounded-xl focus:border-cyan-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {state?.errors?.confirmPassword && <p className="text-xs text-red-500">{state.errors.confirmPassword[0]}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  className="border-slate-300 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 mt-0.5"
                />
                <div className="grid gap-1 leading-normal">
                  <label
                    htmlFor="terms"
                    className="text-xs sm:text-sm text-slate-600 cursor-pointer"
                  >
                    Li e concordo com os{" "}
                    <Link href="/termos" target="_blank" className="text-cyan-700 hover:text-cyan-800 font-bold underline">
                      Termos de Uso
                    </Link>{" "}
                    e com a{" "}
                    <Link href="/privacidade" target="_blank" className="text-cyan-700 hover:text-cyan-800 font-bold underline">
                      Política de Privacidade
                    </Link>
                  </label>
                </div>
              </div>
              {!acceptedTerms && state?.errors?.terms && (
                <p className="text-xs text-red-500">{state.errors.terms[0]}</p>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-0"
                  disabled={!acceptedTerms}
                >
                  Finalizar Cadastro
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
            Já possui uma conta?{" "}
            <Link href="/login" className="underline text-cyan-700 hover:text-cyan-800 font-bold transition-colors">
              Fazer login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
