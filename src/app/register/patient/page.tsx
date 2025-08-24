
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

export default function PatientRegisterPage() {
  return (
     <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader>
                <CardTitle className="text-xl">Cadastro de Paciente</CardTitle>
                <CardDescription>
                Crie sua conta para começar a usar os serviços da MediAI.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="full-name">Nome Completo</Label>
                    <Input id="full-name" placeholder="Seu nome completo" required />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" />
                </div>
                <Button type="submit" className="w-full">
                    Criar Conta
                </Button>
                </div>
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
