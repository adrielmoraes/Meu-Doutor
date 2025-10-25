/**
 * Sistema de cache em memória para MediAI
 * Cache simples com TTL (Time To Live) e LRU (Least Recently Used)
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 1000; // Máximo de entradas
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutos padrão

  /**
   * Armazena um valor no cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    
    // Se o cache está cheio, remover entrada menos usada
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Recupera um valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value as T;
  }

  /**
   * Remove uma entrada específica do cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Remove todas as entradas que começam com um prefixo
   */
  invalidatePattern(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Remove a entrada menos recentemente usada (LRU)
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score baseado em acessos e tempo
      const score = entry.accessCount * 1000 + (Date.now() - entry.lastAccessed);
      
      if (score < lruScore) {
        lruScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
    };
  }

  private calculateHitRate(): number {
    let totalAccesses = 0;
    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
    }
    return totalAccesses / Math.max(1, this.cache.size);
  }
}

// Singleton instance
export const cache = new MemoryCache();

// Cleanup a cada 10 minutos
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Helper para cachear resultados de funções
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Tentar do cache primeiro
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Executar função e cachear resultado
  const result = await fn();
  cache.set(key, result, ttl);
  return result;
}

/**
 * Gerar chave de cache baseada em parâmetros
 */
export function cacheKey(prefix: string, ...params: any[]): string {
  return `${prefix}:${params.map(p => JSON.stringify(p)).join(':')}`;
}
