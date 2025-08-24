
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

export default function DoctorRegisterPage() {
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
                <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="full-name">Nome Completo</Label>
                    <Input id="full-name" placeholder="Seu nome completo" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input id="crm" placeholder="Seu registro no CRM" required />
                </div>

                 <div className="grid gap-2">
                    <Label htmlFor="specialty">Especialidade</Label>
                     <Select>
                        <SelectTrigger id="specialty">
                            <SelectValue placeholder="Selecione sua especialidade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cardiologia">Cardiologia</SelectItem>
                            <SelectItem value="neurologia">Neurologia</SelectItem>
                            <SelectItem value="clinica-geral">Clínica Geral</SelectItem>
                            <SelectItem value="dermatologia">Dermatologia</SelectItem>
                            <SelectItem value="ortopedia">Ortopedia</SelectItem>
                        </SelectContent>
                    </Select>
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
                    Criar Conta Profissional
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
