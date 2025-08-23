import Header from "@/components/layout/header";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-muted/20">
        {children}
      </main>
    </div>
  );
}
