
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
// REMOVER: import { getDoctors } from "@/lib/firestore-admin-adapter"; 
import { Award, Star, Clock, Zap, CheckSquare, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Doctor } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { getSession } from "@/lib/session"; // Importar getSession para obter o ID do doutor logado
// REMOVER: import ManageAvailability from '@/components/doctor/manage-availability'; 
import { getDoctorById } from '@/lib/firestore-admin-adapter'; // Adicionar importação para getDoctorById

// A map to render icons based on the badge name
const iconMap: { [key: string]: React.ReactNode } = {
  Award: <Award className="h-6 w-6 text-yellow-500" />,
  Star: <Star className="h-6 w-6 text-blue-500" />,
  Clock: <Clock className="h-6 w-6 text-green-500" />,
  Zap: <Zap className="h-6 w-6 text-purple-500" />,
};

async function getDoctorProfileData(doctorId: string): Promise<{ doctor: Doctor | null, error?: string, fixUrl?: string }> {
  try {
    const adminDb = (await import('@/lib/firebase-admin')).getAdminDb();
    const doctorDoc = await adminDb.collection('doctors').doc(doctorId).get();

    if (!doctorDoc.exists) {
        return { doctor: null, error: "Perfil do médico não encontrado." };
    }
    return { doctor: { id: doctorDoc.id, ...doctorDoc.data() } as Doctor };

  } catch (e: any) {
    const errorMessage = e.message?.toLowerCase() || '';
    const errorCode = (typeof e.code === 'string' ? e.code.toLowerCase() : '') || '';
    
    if (errorMessage.includes('client is offline') || errorMessage.includes('5 not_found') || errorCode.includes('not-found')) {
        const firestoreApiUrl = `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;
        return { 
            doctor: null,
            error: "Não foi possível conectar ao banco de dados. A API do Cloud Firestore pode estar desativada ou o cliente está offline.",
            fixUrl: firestoreApiUrl 
        };
    }
    console.error("Unexpected error fetching doctor profile:", e);
    return { doctor: null, error: "Ocorreu um erro inesperado ao carregar o perfil do médico." };
  }
}

const getLevelName = (level: number) => {
    const levels = ["Residente", "Clínico Geral", "Especialista", "Consultor Sênior", "Mestre em Diagnóstico"];
    return levels[level - 1] || "Médico";
}

export default async function DoctorProfilePage() {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
      redirect('/login');
  }

  const { doctor, error, fixUrl } = await getDoctorProfileData(session.userId); 

  if (error || !doctor) {
     return (
        <div className="container mx-auto">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao Carregar Perfil</AlertTitle>
                <AlertDescription>
                    {error}
                    {fixUrl && (
                        <p className="mt-2">
                            Por favor, habilite a API manualmente visitando o seguinte link e clicando em "Habilitar":
                            <br />
                            <Link href={fixUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                                Habilitar API do Firestore
                            </Link>
                            <br />
                            <span className="text-xs">Após habilitar, aguarde alguns minutos e atualize esta página.</span>
                        </p>
                    )}
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  const progressPercentage = (doctor.xp / doctor.xpToNextLevel) * 100;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil e Progresso</h1>
        <p className="text-muted-foreground">
          Acompanhe seu desenvolvimento, conquistas e níveis na plataforma MediAI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
              <AvatarImage src={doctor.avatar} data-ai-hint={doctor.avatarHint} />
              <AvatarFallback>{doctor.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{doctor.name}</CardTitle>
            <CardDescription>{doctor.specialty}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-lg font-bold text-primary">{getLevelName(doctor.level)} - Nível {doctor.level}</div>
            <p className="text-sm text-muted-foreground">Continue assim para avançar!</p>
          </CardContent>
        </Card>

        {/* Gamification Stats Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Estatísticas de Desempenho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold">Progresso para o Nível {doctor.level + 1}</h3>
                <p className="text-sm font-bold">{doctor.xp} / {doctor.xpToNextLevel} XP</p>
              </div>
              <Progress value={progressPercentage} />
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <CheckSquare className="h-8 w-8 text-primary"/>
                <div>
                    <p className="font-bold text-2xl">{doctor.validations}</p>
                    <p className="text-sm text-muted-foreground">Total de Diagnósticos Validados</p>
                </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Minhas Conquistas (Badges)</h3>
              <div className="flex gap-4 flex-wrap">
                {doctor.badges.length > 0 ? doctor.badges.map(badge => (
                  <TooltipProvider key={badge.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-2 p-3 border rounded-lg w-24 h-24 justify-center bg-background transform transition-transform hover:scale-110 hover:shadow-lg">
                          {iconMap[badge.icon] || <Award />}
                          <p className="text-xs text-center font-medium">{badge.name}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{badge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )) : (
                  <p className="text-sm text-muted-foreground">Continue validando para ganhar novas conquistas!</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
       {/* REMOVER: Manage Availability Component */}
      {/* <div className="lg:col-span-3">
        <ManageAvailability doctorId={doctor.id} initialAvailability={doctor.availability || []} />
      </div> */}
    </div>
  );
}
