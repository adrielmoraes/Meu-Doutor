
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDoctors } from "@/lib/firestore-adapter";
import { Award, Star, Clock, Zap, CheckSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { notFound } from "next/navigation";

// A map to render icons based on the badge name
const iconMap: { [key: string]: React.ReactNode } = {
  Award: <Award className="h-6 w-6 text-yellow-500" />,
  Star: <Star className="h-6 w-6 text-blue-500" />,
  Clock: <Clock className="h-6 w-6 text-green-500" />,
  Zap: <Zap className="h-6 w-6 text-purple-500" />,
};

// Assuming we're showing the profile for the first doctor for this prototype
async function getDoctorProfile() {
  try {
    const doctors = await getDoctors();
    // In a real app, you would get the logged-in doctor's ID
    return doctors[0];
  } catch (error) {
    console.error("Failed to fetch doctors for profile:", error);
    return null;
  }
}

const getLevelName = (level: number) => {
    const levels = ["Residente", "Clínico Geral", "Especialista", "Consultor Sênior", "Mestre em Diagnóstico"];
    return levels[level - 1] || "Médico";
}

export default async function DoctorProfilePage() {
  const doctor = await getDoctorProfile();

  if (!doctor) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Erro ao Carregar Perfil</CardTitle>
                <CardDescription>
                    Não foi possível carregar os dados do médico. Verifique a conexão com o banco de dados e se os dados de seed foram populados.
                </CardDescription>
            </CardHeader>
        </Card>
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
    </div>
  );
}
