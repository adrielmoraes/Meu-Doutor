
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
import { createPatientAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      
      <Card className="mx-auto max-w-md w-full shadow-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 relative z-10">
        <CardHeader className="space-y-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <User className="h-7 w-7 text-cyan-400" />
          </div>
          
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Cadastro de Paciente
          </CardTitle>
          <CardDescription className="text-blue-200/70">
            Preencha os dados abaixo para criar sua conta
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={dispatch}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-blue-100">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  className="bg-slate-900/50 border-cyan-500/30 focus:border-cyan-500 text-white placeholder:text-slate-500"
                />
                {state?.errors?.name && <p className="text-xs text-red-400">{state.errors.name[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-blue-100">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="bg-slate-900/50 border-cyan-500/30 focus:border-cyan-500 text-white placeholder:text-slate-500"
                />
                {state?.errors?.email && <p className="text-xs text-red-400">{state.errors.email[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-blue-100">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-slate-900/50 border-cyan-500/30 focus:border-cyan-500 text-white"
                />
                {state?.errors?.password && <p className="text-xs text-red-400">{state.errors.password[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-blue-100">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="bg-slate-900/50 border-cyan-500/30 focus:border-cyan-500 text-white"
                />
                {state?.errors?.confirmPassword && <p className="text-xs text-red-400">{state.errors.confirmPassword[0]}</p>}
              </div>

              <SubmitButton />
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm text-blue-200/70">
            Já possui uma conta?{" "}
            <Link href="/login" className="underline text-cyan-400 hover:text-cyan-300 font-medium">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
