import Header from "@/components/layout/header";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1" style={{ background: 'linear-gradient(to right, #edb6d9, #f2f3ef)' }}>
        {children}
      </main>
    </div>
  );
}
