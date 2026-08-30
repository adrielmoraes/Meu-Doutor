'use client';

import { useEffect, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { createDoctorAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Stethoscope, Eye, EyeOff, ChevronDown, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import MediAILogo from "@/components/layout/mediai-logo";

const MEDICAL_SPECIALTIES = [
  "Acupuntura",
  "Alergia e Imunologia",
  "Anestesiologia",
  "Angiologia",
  "Cardiologia",
  "Cirurgia Cardiovascular",
  "Cirurgia da Mão",
  "Cirurgia de Cabeça e Pescoço",
  "Cirurgia do Aparelho Digestivo",
  "Cirurgia Geral",
  "Cirurgia Oncológica",
  "Cirurgia Pediátrica",
  "Cirurgia Plástica",
  "Cirurgia Torácica",
  "Cirurgia Vascular",
  "Clínica Médica",
  "Coloproctologia",
  "Dermatologia",
  "Endocrinologia e Metabologia",
  "Endoscopia",
  "Gastroenterologia",
  "Genética Médica",
  "Geriatria",
  "Ginecologia e Obstetrícia",
  "Hematologia e Hemoterapia",
  "Homeopatia",
  "Infectologia",
  "Mastologia",
  "Medicina de Emergência",
  "Medicina de Família e Comunidade",
  "Medicina do Trabalho",
  "Medicina Esportiva",
  "Medicina Física e Reabilitação",
  "Medicina Intensiva",
  "Medicina Legal e Perícia Médica",
  "Medicina Nuclear",
  "Medicina Preventiva e Social",
  "Nefrologia",
  "Neurocirurgia",
  "Neurologia",
  "Nutrologia",
  "Oftalmologia",
  "Oncologia Clínica",
  "Ortopedia e Traumatologia",
  "Otorrinolaringologia",
  "Patologia",
  "Patologia Clínica/Medicina Laboratorial",
  "Pediatria",
  "Pneumologia",
  "Psiquiatria",
  "Radiologia e Diagnóstico por Imagem",
  "Radioterapia",
  "Reumatologia",
  "Urologia"
];

export default function DoctorRegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const initialState = { message: null, errors: null, success: false };
  const [state, formAction] = useActionState(createDoctorAction, initialState);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [customSpecialty, setCustomSpecialty] = useState("");

  useEffect(() => {
    if (!state) return;

    if (state.success && state.message) {
      toast({
        title: '🎉 Cadastro Realizado com Sucesso!',
        description: state.message,
        className: "bg-emerald-50 text-emerald-900 border-emerald-300 shadow-lg",
        duration: 12000,
      });
      setTimeout(() => {
        router.push('/login');
      }, 5000);
    } else if (state.message && !state.success) {
      toast({
        variant: "destructive",
        title: 'Erro no Cadastro',
        description: state.message,
      });
    }
  }, [state, toast, router]);

  const handleSpecialtySelect = (value: string) => {
    setSelectedSpecialty(value);
    setCustomSpecialty("");
    setSpecialtyOpen(false);
  };

  const handleCustomSpecialtyChange = (value: string) => {
    setCustomSpecialty(value);
    if (value) {
      setSelectedSpecialty("");
    }
  };

  const finalSpecialty = customSpecialty || selectedSpecialty;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden px-4 py-12 selection:bg-cyan-500 selection:text-white">
      {/* Background Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-200/40 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="mb-8 relative z-10 flex justify-center">
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <MediAILogo size="lg" />
        </Link>
      </div>

      <Card className="mx-auto max-w-lg w-full shadow-2xl bg-white border border-slate-200 relative z-10 rounded-3xl overflow-hidden shadow-slate-900/5">
        {/* Top accent bar */}
        <div className="h-1.5 bg-cyan-500 w-full"></div>

        <CardHeader className="space-y-3 pt-8 pb-4 px-6 sm:px-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 w-fit">
            <Stethoscope className="h-4 w-4 text-cyan-600" />
            <span className="text-xs text-cyan-900 font-semibold uppercase tracking-wider">Conta Profissional (CRM)</span>
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-cyan-900 tracking-tight">
            Cadastro de Médico
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm">
            Cadastre-se para atender pacientes via telemedicina e usar o copiloto diagnóstico
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-8">
          <form action={formAction}>
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Nome Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Dr(a). Seu Nome Completo"
                  required
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                />
                {state?.errors?.fullName && <p className="text-xs text-red-500">{state.errors.fullName[0]}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="crm" className="text-sm font-medium text-slate-700">CRM / UF</Label>
                  <Input
                    id="crm"
                    name="crm"
                    placeholder="123456/SP"
                    required
                    minLength={4}
                    className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                  />
                  {state?.errors?.crm && <p className="text-xs text-red-500">{state.errors.crm[0]}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cpf" className="text-sm font-medium text-slate-700">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    placeholder="000.000.000-00"
                    type="text"
                    pattern="\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}"
                    title="Digite um CPF válido (000.000.000-00 ou 11 dígitos)"
                    className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                  />
                  {state?.errors?.cpf && <p className="text-xs text-red-500">{state.errors.cpf[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate" className="text-sm font-medium text-slate-700">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    className="bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500 rounded-xl"
                  />
                  {state?.errors?.birthDate && <p className="text-xs text-red-500">{state.errors.birthDate[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Telefone / WhatsApp</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    pattern="\(\d{2}\)\s?\d{4,5}-?\d{4}|\d{10,11}"
                    title="Digite um telefone válido"
                    className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                  />
                  {state?.errors?.phone && <p className="text-xs text-red-500">{state.errors.phone[0]}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="specialty" className="text-sm font-medium text-slate-700">Especialidade Principal</Label>
                <input type="hidden" name="specialty" value={finalSpecialty} />

                <div className="space-y-2">
                  <Popover open={specialtyOpen} onOpenChange={setSpecialtyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={specialtyOpen}
                        className="w-full justify-between bg-slate-50 border-slate-300 hover:bg-slate-100 hover:border-cyan-500 text-slate-900 rounded-xl h-11"
                      >
                        {selectedSpecialty || "Selecione uma especialidade médica..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 bg-white border border-slate-200 text-slate-900 rounded-xl shadow-xl">
                      <Command className="bg-white text-slate-900">
                        <CommandInput
                          placeholder="Buscar especialidade..."
                          className="text-slate-900 border-b border-slate-100"
                        />
                        <CommandList>
                          <CommandEmpty className="text-slate-500 p-4 text-sm">
                            Especialidade não encontrada. Digite abaixo.
                          </CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {MEDICAL_SPECIALTIES.map((specialty) => (
                              <CommandItem
                                key={specialty}
                                value={specialty}
                                onSelect={() => handleSpecialtySelect(specialty)}
                                className="text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSpecialty === specialty ? "opacity-100 text-cyan-600" : "opacity-0"
                                  )}
                                />
                                {specialty}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Input
                    id="customSpecialty"
                    placeholder="Ou digite outra especialidade..."
                    value={customSpecialty}
                    onChange={(e) => handleCustomSpecialtyChange(e.target.value)}
                    className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl text-sm"
                  />

                  {finalSpecialty && (
                    <p className="text-xs text-cyan-800 font-bold">
                      ✓ Especialidade selecionada: {finalSpecialty}
                    </p>
                  )}
                </div>
                {state?.errors?.specialty && <p className="text-xs text-red-500">{state.errors.specialty[0]}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="city" className="text-sm font-medium text-slate-700">Cidade de Atuação</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Sua cidade"
                    required
                    className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                  />
                  {state?.errors?.city && <p className="text-xs text-red-500">{state.errors.city[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-sm font-medium text-slate-700">UF</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="SP"
                    required
                    maxLength={2}
                    className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl uppercase text-center"
                  />
                  {state?.errors?.state && <p className="text-xs text-red-500">{state.errors.state[0]}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail Profissional</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="medico@clinica.com"
                  required
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 rounded-xl"
                />
                {state?.errors?.email && <p className="text-xs text-red-500">{state.errors.email[0]}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Senha (mín. 6)</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="bg-slate-50 border-slate-300 text-slate-900 pr-10 rounded-xl focus:border-cyan-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {state?.errors?.password && <p className="text-xs text-red-500">{state.errors.password[0]}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="bg-slate-50 border-slate-300 text-slate-900 pr-10 rounded-xl focus:border-cyan-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {state?.errors?.confirmPassword && <p className="text-xs text-red-500">{state.errors.confirmPassword[0]}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="document" className="text-sm font-medium text-slate-700">Documento de Identificação (CRM ou RG)</Label>
                <Input
                  id="document"
                  name="document"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="bg-slate-50 border-slate-300 text-slate-900 file:bg-cyan-500 file:text-white file:hover:bg-cyan-600 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-4 file:text-xs file:font-bold cursor-pointer rounded-xl"
                />
                <p className="text-xs text-slate-500">Envie cópia do CRM ou documento oficial com foto. Formatos: PDF, JPG, PNG (máx. 5MB).</p>
                {/* @ts-ignore */}
                {state?.errors?.document && <p className="text-xs text-red-500">{state.errors.document[0]}</p>}
              </div>

              {state.success && state.message && (
                <Alert variant="default" className="bg-emerald-50 border-2 border-emerald-300 shadow-md text-emerald-900 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <AlertTitle className="text-base font-bold text-emerald-900 mb-1">🎉 Cadastro Realizado com Sucesso!</AlertTitle>
                      <AlertDescription className="text-emerald-800 text-sm whitespace-pre-line">
                        {state.message}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              <div className="pt-2">
                <SubmitButton disabled={!finalSpecialty} />
              </div>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
            Já possui uma conta?{" "}
            <Link href="/login" className="underline text-cyan-700 hover:text-cyan-800 font-bold transition-colors">
              Fazer login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-0"
      disabled={pending || disabled}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Processando Cadastro...</span>
        </>
      ) : (
        "Criar Conta Profissional"
      )}
    </Button>
  );
}
