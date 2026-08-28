
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { createPatientAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MediAILogo from '@/components/layout/mediai-logo';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        "Finalizar Cadastro"
      )}
    </Button>
  );
}


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
        className: "bg-green-100 text-green-800 border-green-200",
        duration: 8000,
      });
      setTimeout(() => {
        router.push('/login');
      }, 10000);
    } else if (state.message && !state.success) {
      toast({
        variant: "destructive",
        title: 'Erro no Cadastro',
        description: state.message,
      });
    }
  }, [state, toast, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#070e24] to-slate-950 text-white relative overflow-hidden px-4 py-12">
      {/* Background Ambient Lights */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700 pointer-events-none"></div>

      <div className="mb-8 relative z-10 flex justify-center">
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <MediAILogo size="lg" />
        </Link>
      </div>

      <Card className="mx-auto max-w-lg w-full shadow-2xl bg-slate-900/70 backdrop-blur-2xl border border-white/10 relative z-10 rounded-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>

        <CardHeader className="space-y-3 pt-8 pb-6 px-6 sm:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit">
            <User className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">Conta de Paciente</span>
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
            Cadastro de Paciente
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Preencha seus dados para acessar diagnósticos inteligentes e seu prontuário
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-8">
          <form action={dispatch}>
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-200">Nome Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-slate-500 rounded-xl"
                />
                {state?.errors?.fullName && <p className="text-xs text-red-400">{state.errors.fullName[0]}</p>}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-200">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-slate-500 rounded-xl"
                />
                {state?.errors?.email && <p className="text-xs text-red-400">{state.errors.email[0]}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="cpf" className="text-sm font-medium text-slate-200">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    required
                    className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-slate-500 rounded-xl"
                  />
                  {state?.errors?.cpf && <p className="text-xs text-red-400">{state.errors.cpf[0]}</p>}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="birthDate" className="text-sm font-medium text-slate-200">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    required
                    className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white rounded-xl"
                  />
                  {state?.errors?.birthDate && <p className="text-xs text-red-400">{state.errors.birthDate[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-200">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    required
                    className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-slate-500 rounded-xl"
                  />
                  {state?.errors?.phone && <p className="text-xs text-red-400">{state.errors.phone[0]}</p>}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="gender" className="text-sm font-medium text-slate-200">Gênero</Label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    className="flex h-10 w-full rounded-xl border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="" className="bg-slate-900">Selecione...</option>
                    <option value="Masculino" className="bg-slate-900">Masculino</option>
                    <option value="Feminino" className="bg-slate-900">Feminino</option>
                    <option value="Outro" className="bg-slate-900">Outro</option>
                  </select>
                  {state?.errors?.gender && <p className="text-xs text-red-400">{state.errors.gender[0]}</p>}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="mothersName" className="text-sm font-medium text-slate-200">Nome da Mãe</Label>
                <Input
                  id="mothersName"
                  name="mothersName"
                  type="text"
                  placeholder="Nome completo da mãe"
                  required
                  className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-slate-500 rounded-xl"
                />
                {state?.errors?.mothersName && <p className="text-xs text-red-400">{state.errors.mothersName[0]}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 grid gap-1.5">
                  <Label htmlFor="city" className="text-sm font-medium text-slate-200">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Sua cidade"
                    required
                    className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-slate-500 rounded-xl"
                  />
                  {state?.errors?.city && <p className="text-xs text-red-400">{state.errors.city[0]}</p>}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="state" className="text-sm font-medium text-slate-200">UF</Label>
                  <Input
                    id="state"
                    name="state"
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    required
                    className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-slate-500 rounded-xl uppercase text-center"
                  />
                  {state?.errors?.state && <p className="text-xs text-red-400">{state.errors.state[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-200">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white pr-10 rounded-xl"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {state?.errors?.password && <p className="text-xs text-red-400">{state.errors.password[0]}</p>}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="bg-slate-950/60 border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white pr-10 rounded-xl"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {state?.errors?.confirmPassword && <p className="text-xs text-red-400">{state.errors.confirmPassword[0]}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  className="border-cyan-500/50 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-blue-600 data-[state=checked]:border-cyan-400 mt-0.5"
                />
                <div className="grid gap-1 leading-normal">
                  <label
                    htmlFor="terms"
                    className="text-xs sm:text-sm text-slate-300 cursor-pointer"
                  >
                    Li e concordo com os{" "}
                    <Link href="/termos" target="_blank" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
                      Termos de Uso
                    </Link>{" "}
                    e com a{" "}
                    <Link href="/privacidade" target="_blank" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
                      Política de Privacidade
                    </Link>
                  </label>
                </div>
              </div>
              {!acceptedTerms && state?.errors?.terms && (
                <p className="text-xs text-red-400">{state.errors.terms[0]}</p>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-0"
                  disabled={!acceptedTerms}
                >
                  Finalizar Cadastro
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-slate-400">
            Já possui uma conta?{" "}
            <Link href="/login" className="underline text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Fazer login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
