
import TavusConsultationClient from "@/components/patient/tavus-consultation-client";
import { Stethoscope } from "lucide-react";

export default function LiveConsultationPage() {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
             <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                   <Stethoscope className="h-8 w-8 text-primary" /> Consulta ao Vivo com Avatar IA
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                    Converse em tempo real com o assistente MediAI usando avatar realista com sincronização labial natural.
                </p>
            </div>
            <div className="w-full max-w-6xl">
                 <TavusConsultationClient />
            </div>
        </div>
    )
}
