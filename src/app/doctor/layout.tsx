import React from 'react';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="doctor-layout bg-slate-50 min-h-screen">{children}</div>;
}
