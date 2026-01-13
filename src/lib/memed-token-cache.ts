/**
 * Memed API Token Cache
 * Manages token storage and automatic refresh
 */

interface TokenData {
    token: string;
    expiresAt: number; // Unix timestamp
}

// In-memory cache (server-side only)
const tokenCache = new Map<string, TokenData>();

/**
 * Gets a cached token for a doctor
 * @param doctorId - Doctor's unique identifier
 * @returns cached token or null if expired/not found
 */
export function getCachedToken(doctorId: string): string | null {
    const cached = tokenCache.get(doctorId);

    if (!cached) return null;

    // Check if token is still valid (with 5 minute buffer)
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    if (now >= cached.expiresAt - bufferMs) {
        // Token expired or about to expire
        tokenCache.delete(doctorId);
        return null;
    }

    return cached.token;
}

/**
 * Stores a token in cache
 * @param doctorId - Doctor's unique identifier
 * @param token - JWT token from Memed
 * @param expiresIn - Token lifetime in seconds
 */
export function setCachedToken(doctorId: string, token: string, expiresIn: number): void {
    const expiresAt = Date.now() + (expiresIn * 1000);

    tokenCache.set(doctorId, {
        token,
        expiresAt,
    });
}

/**
 * Clears a cached token
 * @param doctorId - Doctor's unique identifier
 */
export function clearCachedToken(doctorId: string): void {
    tokenCache.delete(doctorId);
}

/**
 * Clears all cached tokens (useful for testing or server restart)
 */
export function clearAllTokens(): void {
    tokenCache.clear();
}

/**
 * Gets cache statistics (useful for debugging)
 */
export function getCacheStats() {
    return {
        size: tokenCache.size,
        entries: Array.from(tokenCache.entries()).map(([doctorId, data]) => ({
            doctorId,
            expiresAt: new Date(data.expiresAt).toISOString(),
            isValid: Date.now() < data.expiresAt,
        })),
    };
}
