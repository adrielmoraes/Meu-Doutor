
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

export default function PatientRegisterPage() {
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
                <div className="grid gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="full-name">Nome Completo</Label>
                      <Input id="full-name" placeholder="Seu nome completo" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="birth-date">Data de Nascimento</Label>
                      <Input id="birth-date" type="date" required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="gender">Gênero</Label>
                         <Select>
                            <SelectTrigger id="gender">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="feminino">Feminino</SelectItem>
                                <SelectItem value="masculino">Masculino</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                                <SelectItem value="nao-informar">Prefiro não informar</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input id="cpf" placeholder="000.000.000-00" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" type="tel" placeholder="(00) 00000-0000" required />
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-2 grid gap-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1 grid gap-2">
                           <Label htmlFor="zip-code">CEP</Label>
                           <Input id="zip-code" placeholder="00000-000" />
                        </div>
                        <div className="md:col-span-2 grid gap-2">
                           <Label htmlFor="address">Endereço</Label>
                           <Input id="address" placeholder="Rua, Avenida..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                           <Label htmlFor="number">Número</Label>
                           <Input id="number" />
                        </div>
                        <div className="grid gap-2">
                           <Label htmlFor="complement">Complemento</Label>
                           <Input id="complement" placeholder="Apto, Bloco, etc." />
                        </div>
                         <div className="grid gap-2">
                           <Label htmlFor="neighborhood">Bairro</Label>
                           <Input id="neighborhood" />
                        </div>
                      </div>
                  </div>


                  <div className="border-t pt-4 mt-2 grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">E-mail de Acesso</Label>
                        <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Crie uma Senha</Label>
                        <Input id="password" type="password" required />
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-2">
                      Finalizar Cadastro
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
