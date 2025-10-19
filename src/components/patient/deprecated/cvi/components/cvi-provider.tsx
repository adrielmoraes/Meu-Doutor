
"use client";

import { DailyProvider } from "@daily-co/daily-react";
import DailyIframe from "@daily-co/daily-js";

// Singleton pattern conforme documentação Tavus
const getOrCreateCallObject = () => {
  // Use a property on window to store the singleton
  if (typeof window !== 'undefined' && !window._dailyCallObject) {
    window._dailyCallObject = DailyIframe.createCallObject({
      // Configurações otimizadas conforme documentação
      audioSource: true,
      videoSource: true,
    });
  }
  return window._dailyCallObject || null;
};

export function CVIProvider({ children }: { children: React.ReactNode }) {
  const callObject = getOrCreateCallObject();
  
  return (
    <DailyProvider callObject={callObject}>
      {children}
    </DailyProvider>
  );
}

// Declaração TypeScript para window
declare global {
  interface Window {
    _dailyCallObject?: any;
  }
}
