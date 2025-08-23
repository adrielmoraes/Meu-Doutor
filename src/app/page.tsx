import Header from "@/components/layout/header";
import PatientDashboard from "@/components/patient/patient-dashboard";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <PatientDashboard />
      </main>
    </div>
  );
}
