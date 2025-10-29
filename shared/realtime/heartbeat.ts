'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface HeartbeatOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onHealthy?: (latency: number) => void;
  onUnhealthy?: () => void;
  sendPing: () => Promise<void>;
}

/**
 * Generic heartbeat hook for monitoring connection health with periodic pings.
 * 
 * @param options - Heartbeat configuration options
 * @returns Health status and control functions
 * 
 * @example
 * ```tsx
 * const { isHealthy, latency, start, stop } = useHeartbeat({
 *   intervalMs: 5000,
 *   timeoutMs: 3000,
 *   sendPing: async () => {
 *     await fetch('/api/ping');
 *   },
 *   onUnhealthy: () => console.log('Connection unhealthy!')
 * });
 * ```
 */
export function useHeartbeat(options: HeartbeatOptions) {
  const {
    intervalMs = 5000,
    timeoutMs = 3000,
    onHealthy,
    onUnhealthy,
    sendPing,
  } = options;

  const [isHealthy, setIsHealthy] = useState(true);
  const [latency, setLatency] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Execute a single ping and measure latency
   */
  const executePing = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Ping timeout'));
        }, timeoutMs);
      });

      await Promise.race([sendPing(), timeoutPromise]);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const endTime = performance.now();
      const measuredLatency = endTime - startTime;

      setLatency(measuredLatency);
      setIsHealthy(true);
      onHealthy?.(measuredLatency);
    } catch (error) {
      console.error('[Heartbeat] Ping failed:', error);
      setIsHealthy(false);
      onUnhealthy?.();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [sendPing, timeoutMs, onHealthy, onUnhealthy]);

  /**
   * Start the heartbeat monitoring
   */
  const start = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);
    executePing();

    intervalRef.current = setInterval(() => {
      executePing();
    }, intervalMs);
  }, [isRunning, intervalMs, executePing]);

  /**
   * Stop the heartbeat monitoring
   */
  const stop = useCallback(() => {
    setIsRunning(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isHealthy,
    latency,
    isRunning,
    start,
    stop,
  };
}

/**
 * LiveKit-specific heartbeat hook that monitors room connection health.
 * 
 * @param room - LiveKit Room instance
 * @returns Health status and control functions
 * 
 * @example
 * ```tsx
 * const { isHealthy, latency, start, stop } = useLiveKitHeartbeat(room);
 * ```
 */
export function useLiveKitHeartbeat(room: any) {
  const sendPing = useCallback(async () => {
    if (!room) {
      throw new Error('Room not available');
    }

    if (room.state !== 'connected') {
      throw new Error('Room not connected');
    }

    await room.engine.client.ping();
  }, [room]);

  return useHeartbeat({
    intervalMs: 10000,
    timeoutMs: 5000,
    sendPing,
    onUnhealthy: () => {
      console.warn('[LiveKitHeartbeat] Room connection unhealthy');
    },
  });
}

/**
 * WebRTC-specific heartbeat hook for SimplePeer connections.
 * 
 * @param peer - SimplePeer instance
 * @returns Health status and control functions
 * 
 * @example
 * ```tsx
 * const { isHealthy, latency, start, stop } = useWebRTCHeartbeat(peer);
 * ```
 */
export function useWebRTCHeartbeat(peer: any) {
  const lastPongRef = useRef<number>(Date.now());
  const [latency, setLatency] = useState<number>(0);

  const sendPing = useCallback(async () => {
    if (!peer || peer.destroyed) {
      throw new Error('Peer not available or destroyed');
    }

    return new Promise<void>((resolve, reject) => {
      const pingTime = Date.now();
      const timeoutId = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 3000);

      const handlePong = () => {
        clearTimeout(timeoutId);
        const pongTime = Date.now();
        const measuredLatency = pongTime - pingTime;
        lastPongRef.current = pongTime;
        setLatency(measuredLatency);
        peer.off('data', handlePong);
        resolve();
      };

      peer.on('data', (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'pong') {
            handlePong();
          }
        } catch (e) {
          // Not a JSON message, ignore
        }
      });

      peer.send(JSON.stringify({ type: 'ping', timestamp: pingTime }));
    });
  }, [peer]);

  const heartbeat = useHeartbeat({
    intervalMs: 8000,
    timeoutMs: 4000,
    sendPing,
    onUnhealthy: () => {
      console.warn('[WebRTCHeartbeat] Peer connection unhealthy');
    },
  });

  return {
    ...heartbeat,
    latency,
  };
}
