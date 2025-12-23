
import LiveMonitoringClient from "@/components/patient/live-monitoring-client";
import { Activity } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function LiveMonitoringPage() {
    const session = await getSession();
    if (!session || session.role !== 'patient') {
        redirect("/login");
    }
    const patientId = session.userId;

    return (
        <div className="container mx-auto px-3 py-4 sm:p-6 lg:p-8 flex flex-col items-center">
             <div className="mb-4 sm:mb-6 lg:mb-8 text-center w-full">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center justify-center gap-2 flex-wrap">
                   <Activity className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary" /> 
                   <span>Monitoramento de Sinais Vitais</span>
                </h1>
                <p className="text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground mt-2 max-w-2xl mx-auto px-2">
                    Esta é uma simulação de alta fidelidade que demonstra como os dados de um wearable (relógio, cinta, etc.) seriam exibidos em tempo real.
                </p>
            </div>
            <div className="w-full max-w-7xl">
                 <LiveMonitoringClient patientId={patientId} />
            </div>
        </div>
    )
}
