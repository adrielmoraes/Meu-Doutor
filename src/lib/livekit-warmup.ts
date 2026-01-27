/**
 * LiveKit Connection Warmup System
 * Pre-fetches token and prepares connection before user enters consultation
 */

let cachedToken: { token: string; url: string; expiry: number } | null = null;
let ongoingFetch: Promise<{ success: boolean; token?: string; url?: string; error?: string }> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PREEMPTIVE_REFRESH = 60 * 1000; // Refresh 1 minute before expiry

export async function warmupLiveKitConnection(
  patientId: string,
  patientName: string
): Promise<{ success: boolean; token?: string; url?: string; error?: string }> {
  try {
    const now = Date.now();
    
    // Return cached token if still valid
    if (cachedToken && cachedToken.expiry > now + PREEMPTIVE_REFRESH) {
      console.log('[LiveKit Warmup] Using cached token');
      return {
        success: true,
        token: cachedToken.token,
        url: cachedToken.url,
      };
    }

    // If there's an ongoing fetch, wait for it instead of making a new request
    if (ongoingFetch) {
      console.log('[LiveKit Warmup] Joining ongoing fetch');
      return await ongoingFetch;
    }

    console.log('[LiveKit Warmup] Fetching new token');
    
    // Create and store the fetch promise to prevent concurrent requests
    ongoingFetch = (async () => {
      try {
        const roomName = `mediai-consultation-${patientId}`;
        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName,
            participantName: patientName,
            metadata: {
              patient_id: patientId,
              patient_name: patientName,
              session_type: 'medical_consultation'
            }
          })
        });

        if (!response.ok) {
          const error = await response.json();
          return { success: false, error: error.message || 'Failed to get token' };
        }

        const data = await response.json();
        
        // Cache the token
        cachedToken = {
          token: data.token,
          url: data.url,
          expiry: now + CACHE_DURATION,
        };

        console.log('[LiveKit Warmup] Token cached successfully');

        return {
          success: true,
          token: data.token,
          url: data.url,
        };
      } finally {
        // Clear ongoing fetch flag
        ongoingFetch = null;
      }
    })();

    return await ongoingFetch;
  } catch (error) {
    // Clear ongoing fetch on error
    ongoingFetch = null;
    console.error('[LiveKit Warmup] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function getCachedToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiry > now) {
    return cachedToken;
  }
  return null;
}

export function clearCachedToken() {
  cachedToken = null;
}

export function clearConnectionState(patientId: string) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`livekit-consultation-${patientId}`);
    console.log('[LiveKit Warmup] Connection state cleared for patient:', patientId);
  } catch (error) {
    console.error('[LiveKit Warmup] Failed to clear connection state:', error);
  }
}

export async function cleanupRoom(patientId: string): Promise<boolean> {
  try {
    const roomName = `mediai-consultation-${patientId}`;
    console.log('[LiveKit Warmup] Cleaning up room:', roomName);
    
    const response = await fetch('/api/livekit/room', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName }),
    });
    
    if (!response.ok) {
      console.warn('[LiveKit Warmup] Room cleanup failed:', response.status);
      return false;
    }
    
    console.log('[LiveKit Warmup] Room cleaned up successfully');
    return true;
  } catch (error) {
    console.error('[LiveKit Warmup] Room cleanup error:', error);
    return false;
  }
}
