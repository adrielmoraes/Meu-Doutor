'use client';

import { useState, useEffect, useCallback } from 'react';

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';

export type ConnectionType = 
  | 'wifi' 
  | 'cellular' 
  | 'ethernet' 
  | 'unknown';

export interface NetworkQualityState {
  quality: NetworkQuality;
  bandwidth?: number;
  connectionType: ConnectionType;
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

/**
 * Extended Navigator interface with Network Information API
 */
interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
    downlink?: number;
    rtt?: number;
    type?: string;
    addEventListener?: (type: string, listener: EventListener) => void;
    removeEventListener?: (type: string, listener: EventListener) => void;
  };
  mozConnection?: NavigatorWithConnection['connection'];
  webkitConnection?: NavigatorWithConnection['connection'];
}

/**
 * Determine network quality based on available metrics
 */
function determineQuality(
  isOnline: boolean,
  effectiveType?: string,
  downlink?: number,
  rtt?: number
): NetworkQuality {
  if (!isOnline) {
    return 'offline';
  }

  if (effectiveType) {
    switch (effectiveType) {
      case '4g':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
      case 'slow-2g':
        return 'poor';
    }
  }

  if (downlink !== undefined) {
    if (downlink >= 5) return 'excellent';
    if (downlink >= 1.5) return 'good';
    return 'poor';
  }

  if (rtt !== undefined) {
    if (rtt <= 100) return 'excellent';
    if (rtt <= 300) return 'good';
    return 'poor';
  }

  return 'good';
}

/**
 * Determine connection type from connection info
 */
function determineConnectionType(connection?: any): ConnectionType {
  if (!connection) return 'unknown';

  const type = connection.type?.toLowerCase() || '';
  
  if (type.includes('wifi')) return 'wifi';
  if (type.includes('ethernet') || type.includes('wired')) return 'ethernet';
  if (type.includes('cellular') || type.includes('cell')) return 'cellular';

  const effectiveType = connection.effectiveType;
  if (effectiveType && ['4g', '3g', '2g', 'slow-2g'].includes(effectiveType)) {
    return 'cellular';
  }

  return 'unknown';
}

/**
 * React hook for monitoring real-time network quality.
 * Uses the Network Information API when available, with fallback to online/offline events.
 * 
 * @returns Current network quality state
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { quality, bandwidth, connectionType, isOnline } = useNetworkQuality();
 *   
 *   return (
 *     <div>
 *       Connection: {quality} ({connectionType})
 *       {bandwidth && <span>Speed: {bandwidth} Mbps</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNetworkQuality(): NetworkQualityState {
  const [state, setState] = useState<NetworkQualityState>(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    return {
      quality: isOnline ? 'good' : 'offline',
      connectionType: 'unknown',
      isOnline,
    };
  });

  /**
   * Update network quality state
   */
  const updateNetworkQuality = useCallback(() => {
    if (typeof navigator === 'undefined') return;

    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const isOnline = navigator.onLine;

    const effectiveType = connection?.effectiveType;
    const downlink = connection?.downlink;
    const rtt = connection?.rtt;
    const connectionType = determineConnectionType(connection);

    const quality = determineQuality(isOnline, effectiveType, downlink, rtt);

    setState({
      quality,
      bandwidth: downlink,
      connectionType,
      isOnline,
      effectiveType,
      downlink,
      rtt,
    });
  }, []);

  /**
   * Set up event listeners for network changes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    updateNetworkQuality();

    const handleOnline = () => {
      console.log('[NetworkQuality] Network connection restored');
      updateNetworkQuality();
    };

    const handleOffline = () => {
      console.log('[NetworkQuality] Network connection lost');
      setState(prev => ({
        ...prev,
        quality: 'offline',
        isOnline: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection && connection.addEventListener) {
      connection.addEventListener('change', updateNetworkQuality);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection && connection.removeEventListener) {
        connection.removeEventListener('change', updateNetworkQuality);
      }
    };
  }, [updateNetworkQuality]);

  return state;
}
