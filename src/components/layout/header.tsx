import Link from "next/link";
import { Stethoscope, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="bg-card shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              MediAI
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/patient/dashboard">
                <User className="mr-2 h-4 w-4" />
                Portal do Paciente
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/doctor">
                <Stethoscope className="mr-2 h-4 w-4" />
                Portal do Médico
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
