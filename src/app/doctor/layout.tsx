'use client';

import React, { useEffect } from 'react';
import DoctorSidebar from '@/components/layout/doctor-sidebar';
import { getDoctorSettingsAction } from './actions';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    async function initNotifications() {
      try {
        const result = await getDoctorSettingsAction();
        if (result.success && result.settings?.notifications) {
          const { pushNotifications, soundEnabled } = result.settings.notifications;

          if (pushNotifications && 'Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('[DoctorLayout] Push notifications permission:', permission);
          }

          if (soundEnabled) {
            // Set a flag on window so that any part of the app can know if sound is enabled
            // Ex: when a new patient enters the global queue, we can check this flag
            (window as any).__MEDI_AI_SOUND_ENABLED = true;
          } else {
            (window as any).__MEDI_AI_SOUND_ENABLED = false;
          }
        }
      } catch (error) {
        console.error('[DoctorLayout] Failed to initialize notifications', error);
      }
    }

    initNotifications();
  }, []);

  return (
    <div className="doctor-layout bg-slate-50 min-h-screen">
      <DoctorSidebar />
      {/* Main Content Area: offset by sidebar width on desktop */}
      <main className="md:ml-60 transition-all duration-300 min-h-screen">
        {children}
      </main>
    </div>
  );
}
