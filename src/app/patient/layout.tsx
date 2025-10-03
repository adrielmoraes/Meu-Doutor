import React from 'react';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="patient-layout bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen">{children}</div>;
}
