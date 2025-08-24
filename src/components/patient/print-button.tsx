
"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function PrintButton() {
  const handlePrint = () => {
    // Ensure this code runs only in the browser
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Button variant="outline" onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      Imprimir
    </Button>
  );
}
