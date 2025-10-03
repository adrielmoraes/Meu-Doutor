
'use client';

import { useEffect, useActionState } from 'react';
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
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createDoctorAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Stethoscope } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DoctorRegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const initialState = { message: null, errors: null, success: false };
  const [state, formAction] = useActionState(createDoctorAction, initialState);

  useEffect(() => {
    if (state.success && state.message) {
        toast({
            title: 'Sucesso!',
            description: state.message,
            className: "bg-green-100 text-green-800 border-green-200",
        });
        setTimeout(() => {
            router.push('/login');
        }, 2000);
    } else if (state.message && state.errors) {
         toast({
            variant: "destructive",
            title: 'Erro no Cadastro',
            description: state.message,
        });
    }
  }, [state, toast, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      
      <Card className="mx-auto max-w-md w-full shadow-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-purple-500/20 relative z-10">
        <CardHeader className="space-y-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Stethoscope className="h-7 w-7 text-purple-400" />
          </div>
          
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            Cadastro de Médico
          </CardTitle>
          <CardDescription className="text-blue-200/70">
            Preencha os dados abaixo para criar sua conta profissional
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={formAction}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="text-blue-100">Nome Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Seu nome completo"
                  required
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                />
                {state?.errors?.fullName && <p className="text-xs text-red-400">{state.errors.fullName[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crm" className="text-blue-100">CRM</Label>
                <Input
                  id="crm"
                  name="crm"
                  placeholder="Seu registro no CRM"
                  required
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                />
                {state?.errors?.crm && <p className="text-xs text-red-400">{state.errors.crm[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="specialty" className="text-blue-100">Especialidade</Label>
                <Select name="specialty" required>
                  <SelectTrigger 
                    id="specialty" 
                    className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white"
                  >
                    <SelectValue placeholder="Selecione sua especialidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-purple-500/30 text-white">
                    <SelectItem value="Cardiologia">Cardiologia</SelectItem>
                    <SelectItem value="Neurologia">Neurologia</SelectItem>
                    <SelectItem value="Clínica Geral">Clínica Geral</SelectItem>
                    <SelectItem value="Dermatologia">Dermatologia</SelectItem>
                    <SelectItem value="Ortopedia">Ortopedia</SelectItem>
                  </SelectContent>
                </Select>
                {state?.errors?.specialty && <p className="text-xs text-red-400">{state.errors.specialty[0]}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city" className="text-blue-100">Cidade de Atuação</Label>
                  <Input 
                    id="city" 
                    name="city" 
                    placeholder="Sua cidade" 
                    required 
                    className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                  />
                  {state?.errors?.city && <p className="text-xs text-red-400">{state.errors.city[0]}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state" className="text-blue-100">Estado</Label>
                  <Input 
                    id="state" 
                    name="state" 
                    placeholder="UF" 
                    required 
                    maxLength={2} 
                    className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                  />
                  {state?.errors?.state && <p className="text-xs text-red-400">{state.errors.state[0]}</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-blue-100">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                />
                {state?.errors?.email && <p className="text-xs text-red-400">{state.errors.email[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-blue-100">Senha (mínimo 6 caracteres)</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white"
                />
                {state?.errors?.password && <p className="text-xs text-red-400">{state.errors.password[0]}</p>}
              </div>

              {state.success && state.message && (
                <Alert variant="default" className="bg-green-100 border-green-200">
                  <AlertTitle>Cadastro realizado!</AlertTitle>
                  <AlertDescription>
                    {state.message}
                  </AlertDescription>
                </Alert>
              )}

              <SubmitButton />
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-blue-200/70">
            Já possui uma conta?{" "}
            <Link href="/login" className="underline text-purple-400 hover:text-purple-300 font-medium">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all" 
        disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        "Criar Conta Profissional"
      )}
    </Button>
  );
}
