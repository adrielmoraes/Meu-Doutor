
'use client';

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { loginAction } from './actions';
import { Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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
                    Entrando...
                </>
            ) : (
                "Entrar"
            )}
        </Button>
    );
}

export default function LoginPage() {
    const { toast } = useToast();
    const router = useRouter();
    const initialState = { message: null, errors: {}, success: false, redirectPath: null };
    const [state, dispatch] = useActionState(loginAction, initialState);

    useEffect(() => {
        if (state.success && state.redirectPath) {
            toast({
                title: 'Login Sucesso!',
                description: state.message || 'Você foi logado com sucesso.',
                className: "bg-green-100 text-green-800 border-green-200",
            });
            router.push(state.redirectPath);
        } else if (state.message && !state.success) {
            toast({
                variant: "destructive",
                title: 'Falha no Login',
                description: state.message,
            });
        }
    }, [state, router, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      
      <Card className="mx-auto max-w-sm w-full shadow-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 relative z-10">
        <CardHeader className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Bem-vindo de volta</span>
          </div>
          
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Login
          </CardTitle>
          <CardDescription className="text-blue-200/70">
            Entre com seu e-mail para acessar sua conta
          </CardDescription>
        </CardHeader>
        
        <CardContent>
            <form action={dispatch}>
                <div className="grid gap-4">
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
                        <div className="flex items-center">
                            <Label htmlFor="password" className="text-blue-100">Senha</Label>
                            <Link
                                href="#"
                                className="ml-auto inline-block text-sm underline text-cyan-400 hover:text-cyan-300"
                            >
                                Esqueceu sua senha?
                            </Link>
                        </div>
                        <Input 
                            id="password" 
                            name="password" 
                            type="password" 
                            required 
                            className="bg-slate-900/50 border-cyan-500/30 focus:border-cyan-500 text-white"
                        />
                        {state?.errors?.password && <p className="text-xs text-red-400">{state.errors.password[0]}</p>}
                    </div>

                    <SubmitButton />
                    
                    <Button 
                        variant="outline" 
                        className="w-full border-2 border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 backdrop-blur-sm" 
                        type="button"
                    >
                        Login com Google
                    </Button>
                </div>
            </form>
            
            <div className="mt-6 text-center text-sm text-blue-200/70">
                Não tem uma conta?{" "}
                <Link href="/register" className="underline text-cyan-400 hover:text-cyan-300 font-medium">
                    Cadastre-se
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
