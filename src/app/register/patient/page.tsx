
'use client';

import { useActionState, useEffect } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const [state, dispatch] = useActionState(createPatientAction, initialState);

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
            title: 'Erro de Validação',
            description: state.message,
        });
    }
  }, [state, toast, router]);

  return (
     <div className="flex min-h-screen items-center justify-center bg-muted/20 py-12">
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                            <Label htmlFor="birthDate">Data de Nascimento</Label>
                            <Input id="birthDate" name="birthDate" type="date" required />
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
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                            <Label htmlFor="cpf">CPF</Label>
                            <Input id="cpf" name="cpf" placeholder="000.000.000-00" required />
                            </div>
                            <div className="grid gap-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="(00) 00000-0000" required />
                            </div>
                        </div>
                        
                        <div className="border-t pt-4 mt-2 grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1 grid gap-2">
                                <Label htmlFor="zip-code">CEP</Label>
                                <Input id="zip-code" name="zip-code" placeholder="00000-000" />
                                </div>
                                <div className="md:col-span-2 grid gap-2">
                                <Label htmlFor="address">Endereço</Label>
                                <Input id="address" name="address" placeholder="Rua, Avenida..." />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                <Label htmlFor="number">Número</Label>
                                <Input id="number" name="number" />
                                </div>
                                <div className="grid gap-2">
                                <Label htmlFor="complement">Complemento</Label>
                                <Input id="complement" name="complement" placeholder="Apto, Bloco, etc." />
                                </div>
                                <div className="grid gap-2">
                                <Label htmlFor="neighborhood">Bairro</Label>
                                <Input id="neighborhood" name="neighborhood" />
                                </div>
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
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Crie uma Senha</Label>
                                <Input id="password" name="password" type="password" required />
                            </div>
                        </div>

                        {state.errors && (
                            <Alert variant="destructive">
                                <AlertTitle>Erro de Validação</AlertTitle>
                                <AlertDescription>
                                    <ul>
                                        {Object.values(state.errors).map((error: any, index: number) => (
                                            <li key={index}>{Array.isArray(error) ? error[0] : error}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}
                        
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
