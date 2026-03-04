'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import DoctorSidebar from '@/components/layout/doctor-sidebar';
import { getDoctorSettingsAction } from './actions';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    <div className="doctor-layout bg-slate-50 dark:bg-slate-950 min-h-screen border-r">
      <DoctorSidebar onCollapseChange={setSidebarCollapsed} />
      {/* Main Content Area: offset by sidebar width on desktop */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        sidebarCollapsed ? "md:ml-[72px]" : "md:ml-60"
      )}>
        {children}
      </main>
    </div>
  );
}
