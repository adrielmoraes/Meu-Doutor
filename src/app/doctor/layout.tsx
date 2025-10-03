import React from 'react';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="doctor-layout bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen">{children}</div>;
}
