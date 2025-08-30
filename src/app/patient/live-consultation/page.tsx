
import LiveConsultationClient from "@/components/patient/live-consultation-client";
import { Stethoscope } from "lucide-react";

export default function LiveConsultationPage() {

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
             <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                   <Stethoscope className="h-8 w-8 text-primary" /> Consulta ao Vivo com IA
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                    Esta é uma demonstração da API de streaming de áudio. Inicie a chamada para conversar em tempo real com o assistente de IA.
                </p>
            </div>
            <div className="w-full max-w-4xl">
                 <LiveConsultationClient />
            </div>
        </div>
    )
}
