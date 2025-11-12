'use client';

import { useEffect, useState } from 'react';
import { warmupLiveKitConnection } from '@/lib/livekit-warmup';

/**
 * Hook to warm up LiveKit connection in the background
 * Fetches token before user enters consultation for instant connection
 */
export function useLiveKitWarmup(patientId: string | null, patientName: string | null) {
  const [isWarming, setIsWarming] = useState(false);
  const [isWarmed, setIsWarmed] = useState(false);

  useEffect(() => {
    if (!patientId || !patientName || isWarming || isWarmed) {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    // Warm up after 2 seconds (let the page load first)
    timeoutId = setTimeout(async () => {
      setIsWarming(true);
      console.log('[LiveKit Warmup Hook] Starting warmup...');
      
      const result = await warmupLiveKitConnection(patientId, patientName);
      
      if (result.success) {
        console.log('[LiveKit Warmup Hook] ✅ Connection pre-loaded! Instant start ready.');
        setIsWarmed(true);
      } else {
        console.warn('[LiveKit Warmup Hook] ⚠️ Warmup failed:', result.error);
      }
      
      setIsWarming(false);
    }, 2000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [patientId, patientName, isWarming, isWarmed]);

  return { isWarming, isWarmed };
}
