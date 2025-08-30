
import { FileScan } from "lucide-react";
import UploadExamClient from "@/components/patient/upload-exam-client";


export default function UploadExamPage() {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
                    <FileScan className="h-8 w-8 text-primary" />
                    Enviar Exames para Análise
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Adicione seus documentos (PDFs, imagens) ou tire fotos com a câmera. Você pode adicionar vários arquivos antes de enviar tudo para a análise da IA.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                 <UploadExamClient />
            </div>
        </div>
    );
}
