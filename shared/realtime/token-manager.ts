'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { decodeJwt } from 'jose';

export interface TokenManagerOptions {
  refreshEndpoint: string;
  refreshMarginMs?: number;
  onTokenRefreshed?: (token: string) => void;
  onRefreshError?: (error: Error) => void;
  maxRetries?: number;
}

interface TokenData {
  token: string;
  url?: string;
  expiresAt?: number;
}

/**
 * React hook for managing LiveKit tokens with automatic refresh before expiration.
 * 
 * @param options - Token manager configuration
 * @returns Token data and control functions
 * 
 * @example
 * ```tsx
 * const { token, url, isValid, refresh } = useTokenManager({
 *   refreshEndpoint: '/api/livekit/token',
 *   refreshMarginMs: 60000, // Refresh 1 minute before expiration
 *   onTokenRefreshed: (newToken) => console.log('Token refreshed'),
 *   onRefreshError: (error) => console.error('Refresh failed', error)
 * });
 * ```
 */
export function useTokenManager(options: TokenManagerOptions) {
  const {
    refreshEndpoint,
    refreshMarginMs = 60000, // Default: refresh 1 minute before expiration
    onTokenRefreshed,
    onRefreshError,
    maxRetries = 3,
  } = options;

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Decode JWT and extract expiration time
   */
  const decodeToken = useCallback((token: string): number | undefined => {
    try {
      const decoded = decodeJwt(token);
      
      if (decoded.exp) {
        return decoded.exp * 1000;
      }
      
      return undefined;
    } catch (error) {
      console.error('[TokenManager] Failed to decode token:', error);
      return undefined;
    }
  }, []);

  /**
   * Check if token is still valid
   */
  const isTokenValid = useCallback((data: TokenData | null): boolean => {
    if (!data || !data.token) return false;
    
    if (!data.expiresAt) return true;
    
    const now = Date.now();
    const timeUntilExpiry = data.expiresAt - now;
    
    return timeUntilExpiry > refreshMarginMs;
  }, [refreshMarginMs]);

  /**
   * Calculate when to schedule next refresh
   */
  const calculateRefreshTime = useCallback((expiresAt: number): number => {
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const timeUntilRefresh = timeUntilExpiry - refreshMarginMs;
    
    return Math.max(timeUntilRefresh, 0);
  }, [refreshMarginMs]);

  /**
   * Clear scheduled refresh
   */
  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  /**
   * Refresh the token from the endpoint
   */
  const refresh = useCallback(async (isAutoRefresh = false): Promise<void> => {
    if (isRefreshing) {
      console.log('[TokenManager] Refresh already in progress');
      return;
    }

    setIsRefreshing(true);

    try {
      const response = await fetch(refreshEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Token missing from refresh response');
      }

      const expiresAt = decodeToken(data.token);
      
      const newTokenData: TokenData = {
        token: data.token,
        url: data.url,
        expiresAt,
      };

      setTokenData(newTokenData);
      setRetryCount(0);
      onTokenRefreshed?.(data.token);

      if (expiresAt) {
        const refreshTime = calculateRefreshTime(expiresAt);
        console.log(
          `[TokenManager] Token will auto-refresh in ${(refreshTime / 1000).toFixed(0)}s`
        );
        
        clearRefreshTimeout();
        refreshTimeoutRef.current = setTimeout(() => {
          refresh(true);
        }, refreshTime);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[TokenManager] Token refresh failed:', err);
      
      setRetryCount(prev => prev + 1);
      onRefreshError?.(err);

      if (isAutoRefresh && retryCount < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        const jitter = Math.random() * 0.3 * retryDelay;
        const delay = retryDelay + jitter;
        
        console.log(
          `[TokenManager] Retrying token refresh in ${(delay / 1000).toFixed(1)}s (attempt ${retryCount + 1}/${maxRetries})`
        );
        
        clearRefreshTimeout();
        refreshTimeoutRef.current = setTimeout(() => {
          refresh(true);
        }, delay);
      } else {
        throw err;
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [
    isRefreshing,
    refreshEndpoint,
    decodeToken,
    calculateRefreshTime,
    clearRefreshTimeout,
    onTokenRefreshed,
    onRefreshError,
    retryCount,
    maxRetries,
  ]);

  /**
   * Set token manually (useful for initial token)
   */
  const setToken = useCallback((token: string, url?: string) => {
    const expiresAt = decodeToken(token);
    
    const newTokenData: TokenData = {
      token,
      url,
      expiresAt,
    };

    setTokenData(newTokenData);

    if (expiresAt) {
      const refreshTime = calculateRefreshTime(expiresAt);
      console.log(
        `[TokenManager] Token set, will auto-refresh in ${(refreshTime / 1000).toFixed(0)}s`
      );
      
      clearRefreshTimeout();
      refreshTimeoutRef.current = setTimeout(() => {
        refresh(true);
      }, refreshTime);
    }
  }, [decodeToken, calculateRefreshTime, clearRefreshTimeout, refresh]);

  /**
   * Clear token and cancel auto-refresh
   */
  const clearToken = useCallback(() => {
    setTokenData(null);
    clearRefreshTimeout();
  }, [clearRefreshTimeout]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearRefreshTimeout();
    };
  }, [clearRefreshTimeout]);

  const isValid = isTokenValid(tokenData);

  return {
    token: tokenData?.token ?? null,
    url: tokenData?.url ?? null,
    expiresAt: tokenData?.expiresAt ?? null,
    isValid,
    isRefreshing,
    refresh,
    setToken,
    clearToken,
  };
}
