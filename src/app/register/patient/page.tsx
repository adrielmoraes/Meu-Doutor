
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
        <Button type="submit" className="w-full mt-2" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? "Finalizando Cadastro..." : "Finalizar Cadastro"}
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
     <div className="flex min-h-screen items-center justify-center py-12" style={{ background: 'linear-gradient(to right, #edb6d9, #f2f3ef)' }}>
        <Card className="mx-auto max-w-lg w-full">
            <CardHeader>
                <CardTitle className="text-xl">Cadastro de Paciente</CardTitle>
                <CardDescription>
                Preencha seus dados para criar sua conta e acessar os serviços da MediAI.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={dispatch}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Nome Completo</Label>
                            <Input id="fullName" name="fullName" placeholder="Seu nome completo" required />
                             {state?.errors?.fullName && <p className="text-xs text-destructive">{state.errors.fullName[0]}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                            <Label htmlFor="birthDate">Data de Nascimento</Label>
                            <Input id="birthDate" name="birthDate" type="date" required />
                             {state?.errors?.birthDate && <p className="text-xs text-destructive">{state.errors.birthDate[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="gender">Gênero</Label>
                                <Select name="gender">
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Feminino">Feminino</SelectItem>
                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                        <SelectItem value="Outro">Outro</SelectItem>
                                        <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                                    </SelectContent>
                                </Select>
                                 {state?.errors?.gender && <p className="text-xs text-destructive">{state.errors.gender[0]}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                            <Label htmlFor="cpf">CPF</Label>
                            <Input id="cpf" name="cpf" placeholder="000.000.000-00" required />
                             {state?.errors?.cpf && <p className="text-xs text-destructive">{state.errors.cpf[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="(00) 00000-0000" required />
                             {state?.errors?.phone && <p className="text-xs text-destructive">{state.errors.phone[0]}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="city">Cidade</Label>
                                <Input id="city" name="city" placeholder="Sua cidade" required />
                                {state?.errors?.city && <p className="text-xs text-destructive">{state.errors.city[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="state">Estado</Label>
                                <Input id="state" name="state" placeholder="UF" required maxLength={2} />
                                {state?.errors?.state && <p className="text-xs text-destructive">{state.errors.state[0]}</p>}
                            </div>
                        </div>

                        <div className="border-t pt-4 mt-2 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">E-mail de Acesso</Label>
                                <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="seu@email.com"
                                required
                                />
                                {state?.errors?.email && <p className="text-xs text-destructive">{state.errors.email[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Crie uma Senha (mínimo 6 caracteres)</Label>
                                <Input id="password" name="password" type="password" required />
                                {state?.errors?.password && <p className="text-xs text-destructive">{state.errors.password[0]}</p>}
                            </div>
                        </div>
                        
                        <SubmitButton />
                    </div>
                </form>
                <div className="mt-4 text-center text-sm">
                Já tem uma conta?{" "}
                <Link href="/login" className="underline">
                    Fazer login
                </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
