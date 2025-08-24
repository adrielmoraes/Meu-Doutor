
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { loginAction } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {pending ? "Entrando..." : "Login"}
        </Button>
    );
}

export default function LoginPage() {
    const initialState = { message: null, errors: {} };
    const [state, dispatch] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Entre com seu e-mail para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form action={dispatch}>
                <div className="grid gap-4">
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
                    <div className="flex items-center">
                        <Label htmlFor="password">Senha</Label>
                        <Link
                        href="#"
                        className="ml-auto inline-block text-sm underline"
                        >
                        Esqueceu sua senha?
                        </Link>
                    </div>
                    <Input id="password" name="password" type="password" required />
                     {state?.errors?.password && <p className="text-xs text-destructive">{state.errors.password[0]}</p>}
                    </div>

                    {state?.message && (
                        <Alert variant="destructive">
                            <AlertTitle>Falha no Login</AlertTitle>
                            <AlertDescription>{state.message}</AlertDescription>
                        </Alert>
                    )}

                    <SubmitButton />
                    <Button variant="outline" className="w-full" type="button">
                    Login com Google
                    </Button>
                </div>
            </form>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/register" className="underline">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
