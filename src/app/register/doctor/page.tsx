
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
import { Loader2 } from 'lucide-react';
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
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(to right, #edb6d9, #f2f3ef)' }}>
      <Card className="mx-auto max-w-md w-full shadow-xl" style={{ background: 'linear-gradient(to bottom right, #fff8fc, #f9e6f3)' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#ea339e]">Cadastro de Médico</CardTitle>
          <CardDescription className="text-black font-medium">
            Preencha os dados abaixo para criar sua conta profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="text-black font-semibold">Nome Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Seu nome completo"
                  required
                  className="border-[#ea339e]/30 focus:border-[#ea339e] bg-white/80"
                />
                {state?.errors?.fullName && <p className="text-xs text-destructive">{state.errors.fullName[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crm" className="text-black font-semibold">CRM</Label>
                <Input
                  id="crm"
                  name="crm"
                  placeholder="Seu registro no CRM"
                  required
                  className="border-[#ea339e]/30 focus:border-[#ea339e] bg-white/80"
                />
                {state?.errors?.crm && <p className="text-xs text-destructive">{state.errors.crm[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="specialty" className="text-black font-semibold">Especialidade</Label>
                <Select name="specialty" required>
                  <SelectTrigger id="specialty" className="border-[#ea339e]/30 focus:border-[#ea339e] bg-white/80">
                    <SelectValue placeholder="Selecione sua especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiologia">Cardiologia</SelectItem>
                    <SelectItem value="Neurologia">Neurologia</SelectItem>
                    <SelectItem value="Clínica Geral">Clínica Geral</SelectItem>
                    <SelectItem value="Dermatologia">Dermatologia</SelectItem>
                    <SelectItem value="Ortopedia">Ortopedia</SelectItem>
                  </SelectContent>
                </Select>
                {state?.errors?.specialty && <p className="text-xs text-destructive">{state.errors.specialty[0]}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city" className="text-black font-semibold">Cidade de Atuação</Label>
                  <Input 
                    id="city" 
                    name="city" 
                    placeholder="Sua cidade" 
                    required 
                    className="border-[#ea339e]/30 focus:border-[#ea339e] bg-white/80"
                  />
                  {state?.errors?.city && <p className="text-xs text-destructive">{state.errors.city[0]}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state" className="text-black font-semibold">Estado</Label>
                  <Input 
                    id="state" 
                    name="state" 
                    placeholder="UF" 
                    required 
                    maxLength={2} 
                    className="border-[#ea339e]/30 focus:border-[#ea339e] bg-white/80"
                  />
                  {state?.errors?.state && <p className="text-xs text-destructive">{state.errors.state[0]}</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-black font-semibold">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="border-[#ea339e]/30 focus:border-[#ea339e] bg-white/80"
                />
                {state?.errors?.email && <p className="text-xs text-destructive">{state.errors.email[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-black font-semibold">Senha (mínimo 6 caracteres)</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="border-[#ea339e]/30 focus:border-[#ea339e] bg-white/80"
                />
                {state?.errors?.password && <p className="text-xs text-destructive">{state.errors.password[0]}</p>}
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

          <div className="mt-4 text-center text-sm text-black">
            Já possui uma conta?{" "}
            <Link href="/login" className="underline text-[#ea339e] hover:text-[#d12b8d] font-medium">
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
    <Button type="submit" className="w-full bg-[#ea339e] hover:bg-[#d12b8d]" disabled={pending}>
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
