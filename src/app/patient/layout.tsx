import React from 'react';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="patient-layout bg-background min-h-screen">{children}</div>;
}
