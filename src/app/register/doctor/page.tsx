
'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
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

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {pending ? "Criando Conta..." : "Criar Conta Profissional"}
        </Button>
    );
}

export default function DoctorRegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const initialState = { message: null, errors: null, success: false };
  const [state, dispatch] = useFormState(createDoctorAction, initialState);

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
    <div className="flex min-h-screen items-center justify-center bg-muted/20 py-12">
        <Card className="mx-auto max-w-md w-full">
            <CardHeader>
                <CardTitle className="text-xl">Cadastro de Médico</CardTitle>
                <CardDescription>
                Preencha seus dados para se juntar à nossa rede de profissionais.
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
                    <div className="grid gap-2">
                        <Label htmlFor="crm">CRM</Label>
                        <Input id="crm" name="crm" placeholder="Seu registro no CRM" required />
                        {state?.errors?.crm && <p className="text-xs text-destructive">{state.errors.crm[0]}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="specialty">Especialidade</Label>
                        <Select name="specialty" required>
                            <SelectTrigger id="specialty">
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
                            <Label htmlFor="city">Cidade de Atuação</Label>
                            <Input id="city" name="city" placeholder="Sua cidade" required />
                            {state?.errors?.city && <p className="text-xs text-destructive">{state.errors.city[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="state">Estado</Label>
                            <Input id="state" name="state" placeholder="UF" required maxLength={2} />
                            {state?.errors?.state && <p className="text-xs text-destructive">{state.errors.state[0]}</p>}
                        </div>
                    </div>


                    <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
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
                        <Label htmlFor="password">Senha (mínimo 6 caracteres)</Label>
                        <Input id="password" name="password" type="password" required />
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
