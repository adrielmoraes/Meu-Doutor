/**
 * LiveKit Connection Warmup System
 * Pre-fetches token and prepares connection before user enters consultation
 */

let cachedToken: { token: string; url: string; expiry: number } | null = null;
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

    console.log('[LiveKit Warmup] Fetching new token');
    
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
  } catch (error) {
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
