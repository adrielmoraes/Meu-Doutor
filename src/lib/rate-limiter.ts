/**
 * Simple in-memory rate limiter for login attempts
 * Prevents brute force attacks by limiting login attempts per IP address
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutos
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutos de bloqueio

  /**
   * Verifica se um IP está bloqueado por exceder o limite de tentativas
   */
  isBlocked(identifier: string): boolean {
    const entry = this.attempts.get(identifier);
    
    if (!entry) return false;
    
    const now = Date.now();
    
    // Se está bloqueado e o bloqueio ainda não expirou
    if (entry.blockedUntil && entry.blockedUntil > now) {
      return true;
    }
    
    // Se o bloqueio expirou, limpar a entrada
    if (entry.blockedUntil && entry.blockedUntil <= now) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return false;
  }

  /**
   * Registra uma tentativa de login falhada
   */
  recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const entry = this.attempts.get(identifier);
    
    if (!entry) {
      // Primeira tentativa
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return;
    }
    
    // Se a janela de tempo expirou, resetar contagem
    if (now > entry.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return;
    }
    
    // Incrementar contagem
    entry.count++;
    
    // Se excedeu o limite, bloquear
    if (entry.count >= this.MAX_ATTEMPTS) {
      entry.blockedUntil = now + this.BLOCK_DURATION_MS;
      console.warn(`[RateLimiter] IP ${identifier} bloqueado por exceder ${this.MAX_ATTEMPTS} tentativas`);
    }
    
    this.attempts.set(identifier, entry);
  }

  /**
   * Registra um login bem-sucedido e limpa tentativas
   */
  recordSuccessfulAttempt(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Retorna o tempo restante de bloqueio em segundos (0 se não bloqueado)
   */
  getBlockedTimeRemaining(identifier: string): number {
    const entry = this.attempts.get(identifier);
    
    if (!entry || !entry.blockedUntil) return 0;
    
    const now = Date.now();
    const remaining = entry.blockedUntil - now;
    
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Retorna o número de tentativas restantes
   */
  getRemainingAttempts(identifier: string): number {
    const entry = this.attempts.get(identifier);
    
    if (!entry) return this.MAX_ATTEMPTS;
    
    const now = Date.now();
    
    // Se a janela expirou, resetar
    if (now > entry.resetTime) {
      return this.MAX_ATTEMPTS;
    }
    
    return Math.max(0, this.MAX_ATTEMPTS - entry.count);
  }

  /**
   * Limpa entradas expiradas periodicamente (executar em background)
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [identifier, entry] of this.attempts.entries()) {
      // Remover se a janela e o bloqueio expiraram
      if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
        this.attempts.delete(identifier);
      }
    }
  }
}

// Singleton instance
export const loginRateLimiter = new RateLimiter();

// Cleanup a cada 10 minutos
if (typeof window === 'undefined') {
  setInterval(() => {
    loginRateLimiter.cleanup();
  }, 10 * 60 * 1000);
}
