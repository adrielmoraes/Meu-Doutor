
import LiveMonitoringClient from "@/components/patient/live-monitoring-client";
import { Activity } from "lucide-react";

export default function LiveMonitoringPage() {

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
             <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                   <Activity className="h-8 w-8 text-primary" /> Monitoramento de Sinais Vitais
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                    Esta é uma simulação de alta fidelidade que demonstra como os dados de um wearable (relógio, cinta, etc.) seriam exibidos em tempo real.
                </p>
            </div>
            <div className="w-full max-w-7xl">
                 <LiveMonitoringClient />
            </div>
        </div>
    )
}
