
"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ExamUploadCard = () => {
  return (
    <Link href="/patient/upload-exam">
      <Card
        className="cursor-pointer transform transition-transform duration-300 hover:scale-[1.03] hover:shadow-xl"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Upload de Exames</CardTitle>
          <Upload className="h-8 w-8 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Carregue múltiplos arquivos ou tire fotos para uma análise completa.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ExamUploadCard;
