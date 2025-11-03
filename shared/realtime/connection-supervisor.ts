'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ConnectionState = 
  | 'idle' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'disconnected' 
  | 'error';

export interface ConnectionSupervisorOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnecting?: (attempt: number) => void;
  onError?: (error: Error) => void;
  persistKey?: string;
}

interface PersistedConnectionState {
  lastState: ConnectionState;
  lastConnectedAt?: number;
  retryCount: number;
}

/**
 * React hook for managing connection lifecycle with automatic reconnection,
 * exponential backoff, and state persistence.
 * 
 * @param options - Configuration options for the connection supervisor
 * @returns Connection state and control functions
 * 
 * @example
 * ```tsx
 * const { state, connect, disconnect, reconnect, isConnected } = useConnectionSupervisor({
 *   maxRetries: 5,
 *   baseDelayMs: 1000,
 *   onConnect: () => console.log('Connected!'),
 *   persistKey: 'livekit-connection'
 * });
 * ```
 */
export function useConnectionSupervisor(options: ConnectionSupervisorOptions) {
  const {
    maxRetries = 5,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    onConnect,
    onDisconnect,
    onReconnecting,
    onError,
    persistKey,
  } = options;

  const [state, setState] = useState<ConnectionState>('idle');
  const [retryCount, setRetryCount] = useState(0);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef(false);

  /**
   * Load persisted connection state from localStorage
   */
  const loadPersistedState = useCallback((): PersistedConnectionState | null => {
    if (!persistKey || typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(persistKey);
      if (!stored) return null;
      
      return JSON.parse(stored) as PersistedConnectionState;
    } catch (error) {
      console.error('[ConnectionSupervisor] Failed to load persisted state:', error);
      return null;
    }
  }, [persistKey]);

  /**
   * Save connection state to localStorage
   */
  const savePersistedState = useCallback((stateToSave: PersistedConnectionState) => {
    if (!persistKey || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(persistKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('[ConnectionSupervisor] Failed to save persisted state:', error);
    }
  }, [persistKey]);

  /**
   * Calculate delay with exponential backoff and jitter
   */
  const calculateBackoffDelay = useCallback((attempt: number): number => {
    const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return exponentialDelay + jitter;
  }, [baseDelayMs, maxDelayMs]);

  /**
   * Clear any pending reconnection timeout
   */
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Initiate connection
   */
  const connect = useCallback(() => {
    isManualDisconnectRef.current = false;
    setState('connecting');
    setRetryCount(0);
    
    if (persistKey) {
      savePersistedState({
        lastState: 'connecting',
        retryCount: 0,
      });
    }
  }, [persistKey, savePersistedState]);

  /**
   * Disconnect and prevent auto-reconnection
   */
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    clearReconnectTimeout();
    setState('disconnected');
    setRetryCount(0);
    
    if (persistKey) {
      savePersistedState({
        lastState: 'disconnected',
        retryCount: 0,
      });
    }
    
    onDisconnect?.();
  }, [clearReconnectTimeout, onDisconnect, persistKey, savePersistedState]);

  /**
   * Attempt to reconnect with exponential backoff
   */
  const reconnect = useCallback(() => {
    if (isManualDisconnectRef.current) {
      console.log('[ConnectionSupervisor] Manual disconnect - skipping reconnection');
      return;
    }

    if (retryCount >= maxRetries) {
      const error = new Error(`Max reconnection attempts (${maxRetries}) exceeded`);
      setState('error');
      onError?.(error);
      
      if (persistKey) {
        savePersistedState({
          lastState: 'error',
          retryCount,
        });
      }
      return;
    }

    const delay = calculateBackoffDelay(retryCount);
    setState('reconnecting');
    
    if (persistKey) {
      savePersistedState({
        lastState: 'reconnecting',
        retryCount,
      });
    }
    
    onReconnecting?.(retryCount + 1);

    clearReconnectTimeout();
    reconnectTimeoutRef.current = setTimeout(() => {
      setRetryCount(prev => prev + 1);
      connect();
    }, delay);
  }, [
    retryCount,
    maxRetries,
    calculateBackoffDelay,
    clearReconnectTimeout,
    connect,
    onReconnecting,
    onError,
    persistKey,
    savePersistedState,
  ]);

  /**
   * Mark connection as successfully connected
   */
  const markConnected = useCallback(() => {
    setState('connected');
    setRetryCount(0);
    clearReconnectTimeout();
    
    if (persistKey) {
      savePersistedState({
        lastState: 'connected',
        lastConnectedAt: Date.now(),
        retryCount: 0,
      });
    }
    
    onConnect?.();
  }, [clearReconnectTimeout, onConnect, persistKey, savePersistedState]);

  /**
   * Handle connection failure and trigger reconnection
   */
  const markFailed = useCallback((error?: Error) => {
    if (isManualDisconnectRef.current) return;
    
    onError?.(error || new Error('Connection failed'));
    reconnect();
  }, [reconnect, onError]);

  /**
   * Load persisted state on mount
   */
  useEffect(() => {
    const persisted = loadPersistedState();
    
    if (persisted && persisted.lastState === 'connected') {
      setState('disconnected');
    }
  }, [loadPersistedState]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
    };
  }, [clearReconnectTimeout]);

  const isConnected = state === 'connected';

  return {
    state,
    connect,
    disconnect,
    reconnect,
    markConnected,
    markFailed,
    isConnected,
    retryCount,
  };
}
