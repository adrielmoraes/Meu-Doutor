
import { getExamsByPatientId } from "@/lib/db-adapter";
import type { Exam } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ExamHistoryClient } from "@/components/patient/exam-history-client";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";


async function getHistoryPageData(patientId: string): Promise<{ exams: Exam[], error?: string, fixUrl?: string }> {
  try {
    const exams = await getExamsByPatientId(patientId);
    return { exams };
  } catch (e: any) {
    const errorMessage = e.message?.toLowerCase() || '';
    const errorCode = e.code?.toLowerCase() || '';

    if (errorMessage.includes('connection') || errorCode.includes('not-found')) {
      return {
        exams: [],
        error: "Não foi possível conectar ao banco de dados. Verifique se o banco de dados está configurado corretamente."
      };
    }
    console.error("Unexpected error fetching exam history:", e);
    return { exams: [], error: "Ocorreu um erro inesperado ao carregar seu histórico de exames." };
  }
}


export default async function ExamHistoryPage() {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
    redirect('/login');
  }

  const { exams, error, fixUrl } = await getHistoryPageData(session.userId);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:bg-gradient-to-r dark:from-primary dark:to-accent dark:bg-clip-text dark:text-transparent">
          Histórico de Exames
        </h1>
        <p className="text-foreground/80 dark:text-muted-foreground">
          Visualize a evolução dos seus exames ao longo do tempo e acesse análises detalhadas.
        </p>
      </div>

      {error ? (
        <div className="container mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro de Configuração ou Conexão</AlertTitle>
            <AlertDescription>
              {error}
              {fixUrl && (
                <p className="mt-2">
                  Por favor, habilite a API manualmente visitando o seguinte link e clicando em &quot;Habilitar&quot;:
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
      ) : (
        <ExamHistoryClient exams={exams} patientId={session.userId} />
      )}
    </div>
  );
}
