
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { createPatientAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
                "Finalizar Cadastro"
            )}
        </Button>
    );
}


export default function PatientRegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const initialState = { message: null, errors: null, success: false };
  const [state, dispatch] = useActionState(createPatientAction, initialState); // Usar useActionState

  useEffect(() => {
    if (state.success && state.message) {
        toast({
            title: 'Sucesso!',
            description: state.message,
            className: "bg-green-100 text-green-800 border-green-200",
        });
        // Redirect to login after a short delay to allow user to see the toast
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
                <CardTitle className="text-2xl font-bold text-[#ea339e]">Cadastro de Paciente</CardTitle>
                <CardDescription className="text-black font-medium">
                Preencha os dados abaixo para criar sua conta
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={dispatch}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-black font-semibold">Nome Completo</Label>
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              placeholder="Seu nome completo"
                              required
                              className="border-[#ea339e]/30 focus:border-[#ea339e] bg-white/80"
                            />
                            {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
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
                            <Label htmlFor="password" className="text-black font-semibold">Senha</Label>
                            <Input
                              id="password"
                              name="password"
                              type="password"
                              required
                              className="border-[#ea339e]/30 focus:border-[#ea339e] bg-white/80"
                            />
                            {state?.errors?.password && <p className="text-xs text-destructive">{state.errors.password[0]}</p>}
                        </div>
    
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword" className="text-black font-semibold">Confirmar Senha</Label>
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              required
                              className="border-[#ea339e]/30 focus:border-[#ea339e] bg-white/80"
                            />
                            {state?.errors?.confirmPassword && <p className="text-xs text-destructive">{state.errors.confirmPassword[0]}</p>}
                        </div>
    
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
  )
}
