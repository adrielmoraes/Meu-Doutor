
'use client';

import { useEffect, useActionState, useState } from 'react';
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
import Link from "next/link"
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
            title: 'Cadastro Realizado!',
            description: state.message,
            className: "bg-green-100 text-green-800 border-green-200",
        });
        setTimeout(() => {
            router.push('/login');
        }, 2000);
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      
      <div className="mb-8 relative z-10 flex justify-center">
        <MediAILogo size="lg" />
      </div>

      <Card className="mx-auto max-w-md w-full shadow-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-purple-500/20 relative z-10">
        <CardHeader className="space-y-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Stethoscope className="h-7 w-7 text-purple-400" />
          </div>
          
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            Cadastro de Médico
          </CardTitle>
          <CardDescription className="text-blue-200/70">
            Preencha os dados abaixo para criar sua conta profissional
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={formAction}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="text-blue-100">Nome Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Seu nome completo"
                  required
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                />
                {state?.errors?.fullName && <p className="text-xs text-red-400">{state.errors.fullName[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crm" className="text-blue-100">CRM</Label>
                <Input
                  id="crm"
                  name="crm"
                  placeholder="Seu registro no CRM (mínimo 4 dígitos)"
                  required
                  minLength={4}
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                />
                {state?.errors?.crm && <p className="text-xs text-red-400">{state.errors.crm[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="specialty" className="text-blue-100">Especialidade</Label>
                <input type="hidden" name="specialty" value={finalSpecialty} />
                
                <div className="space-y-2">
                  <Popover open={specialtyOpen} onOpenChange={setSpecialtyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={specialtyOpen}
                        className="w-full justify-between bg-slate-900/50 border-purple-500/30 hover:bg-slate-800/50 hover:border-purple-500 text-white"
                      >
                        {selectedSpecialty || "Selecione uma especialidade..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 bg-slate-900 border-purple-500/30">
                      <Command className="bg-slate-900">
                        <CommandInput 
                          placeholder="Buscar especialidade..." 
                          className="text-white"
                        />
                        <CommandList>
                          <CommandEmpty className="text-slate-400 p-4 text-sm">
                            Especialidade não encontrada. Use o campo abaixo para digitar.
                          </CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {MEDICAL_SPECIALTIES.map((specialty) => (
                              <CommandItem
                                key={specialty}
                                value={specialty}
                                onSelect={() => handleSpecialtySelect(specialty)}
                                className="text-white hover:bg-purple-500/20 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSpecialty === specialty ? "opacity-100 text-purple-400" : "opacity-0"
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

                  <div className="relative">
                    <Input
                      id="customSpecialty"
                      placeholder="Ou digite sua especialidade aqui"
                      value={customSpecialty}
                      onChange={(e) => handleCustomSpecialtyChange(e.target.value)}
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                    />
                  </div>
                  
                  {finalSpecialty && (
                    <p className="text-xs text-purple-300">
                      Especialidade selecionada: {finalSpecialty}
                    </p>
                  )}
                </div>
                {state?.errors?.specialty && <p className="text-xs text-red-400">{state.errors.specialty[0]}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city" className="text-blue-100">Cidade de Atuação</Label>
                  <Input 
                    id="city" 
                    name="city" 
                    placeholder="Sua cidade" 
                    required 
                    className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                  />
                  {state?.errors?.city && <p className="text-xs text-red-400">{state.errors.city[0]}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state" className="text-blue-100">Estado</Label>
                  <Input 
                    id="state" 
                    name="state" 
                    placeholder="UF" 
                    required 
                    maxLength={2} 
                    className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                  />
                  {state?.errors?.state && <p className="text-xs text-red-400">{state.errors.state[0]}</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-blue-100">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-slate-500"
                />
                {state?.errors?.email && <p className="text-xs text-red-400">{state.errors.email[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-blue-100">Senha (mínimo 6 caracteres)</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"}
                    required 
                    className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {state?.errors?.password && <p className="text-xs text-red-400">{state.errors.password[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-blue-100">Confirmar Senha</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"}
                    required 
                    className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-400 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {state?.errors?.confirmPassword && <p className="text-xs text-red-400">{state.errors.confirmPassword[0]}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="document" className="text-blue-100">Documento de Identificação (CRM/RG)</Label>
                <Input
                  id="document"
                  name="document"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white file:bg-purple-600 file:text-white file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-4 file:text-sm file:font-medium hover:file:bg-purple-700 cursor-pointer"
                />
                <p className="text-xs text-slate-400">Envie uma foto do seu CRM ou documento oficial. Formatos: PDF, JPG, PNG. Máx: 5MB.</p>
                {/* @ts-ignore */}
                {state?.errors?.document && <p className="text-xs text-red-400">{state.errors.document[0]}</p>}
              </div>

              {state.success && state.message && (
                <Alert variant="default" className="bg-green-100 border-green-200">
                  <AlertTitle>Cadastro realizado!</AlertTitle>
                  <AlertDescription>
                    {state.message}
                  </AlertDescription>
                </Alert>
              )}

              <SubmitButton disabled={!finalSpecialty} />
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-blue-200/70">
            Já possui uma conta?{" "}
            <Link href="/login" className="underline text-purple-400 hover:text-purple-300 font-medium">
              Faça login
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
        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50" 
        disabled={pending || disabled}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        "Criar Conta Profissional"
      )}
    </Button>
  );
}
