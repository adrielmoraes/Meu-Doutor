/**
 * Circuit breaker states
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

export interface ResilientApiClientOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerResetTimeMs?: number;
  timeout?: number;
}

export interface ApiMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  circuitState: CircuitState;
  consecutiveFailures: number;
  lastFailureTime?: number;
}

/**
 * Resilient API client with automatic retry, circuit breaker pattern, and fallback support.
 * 
 * @example
 * ```typescript
 * const client = new ResilientApiClient({
 *   maxRetries: 3,
 *   retryDelayMs: 1000,
 *   circuitBreakerThreshold: 5
 * });
 * 
 * const data = await client.call(
 *   async () => fetch('/api/data').then(r => r.json()),
 *   async () => ({ fallbackData: true })
 * );
 * ```
 */
export class ResilientApiClient {
  private maxRetries: number;
  private retryDelayMs: number;
  private circuitBreakerThreshold: number;
  private circuitBreakerResetTimeMs: number;
  private timeout: number;

  private metrics: ApiMetrics = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    circuitState: 'closed',
    consecutiveFailures: 0,
  };

  private circuitOpenedAt?: number;

  constructor(options: ResilientApiClientOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
    this.circuitBreakerThreshold = options.circuitBreakerThreshold ?? 5;
    this.circuitBreakerResetTimeMs = options.circuitBreakerResetTimeMs ?? 60000;
    this.timeout = options.timeout ?? 30000;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics (useful for testing or monitoring)
   */
  resetMetrics(): void {
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      circuitState: 'closed',
      consecutiveFailures: 0,
    };
    this.circuitOpenedAt = undefined;
  }

  /**
   * Check if circuit should transition from open to half-open
   */
  private checkCircuitState(): void {
    if (
      this.metrics.circuitState === 'open' &&
      this.circuitOpenedAt &&
      Date.now() - this.circuitOpenedAt >= this.circuitBreakerResetTimeMs
    ) {
      console.log('[ResilientApiClient] Circuit transitioning to half-open');
      this.metrics.circuitState = 'half-open';
    }
  }

  /**
   * Record a successful call
   */
  private recordSuccess(): void {
    this.metrics.successfulCalls++;
    this.metrics.consecutiveFailures = 0;

    if (this.metrics.circuitState === 'half-open') {
      console.log('[ResilientApiClient] Circuit closing after successful call');
      this.metrics.circuitState = 'closed';
      this.circuitOpenedAt = undefined;
    }
  }

  /**
   * Record a failed call
   */
  private recordFailure(): void {
    this.metrics.failedCalls++;
    this.metrics.consecutiveFailures++;
    this.metrics.lastFailureTime = Date.now();

    if (
      this.metrics.circuitState === 'closed' &&
      this.metrics.consecutiveFailures >= this.circuitBreakerThreshold
    ) {
      console.warn('[ResilientApiClient] Circuit opening due to consecutive failures');
      this.metrics.circuitState = 'open';
      this.circuitOpenedAt = Date.now();
    } else if (this.metrics.circuitState === 'half-open') {
      console.warn('[ResilientApiClient] Circuit reopening after failed test call');
      this.metrics.circuitState = 'open';
      this.circuitOpenedAt = Date.now();
    }
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay = this.retryDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return exponentialDelay + jitter;
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${this.timeout}ms`));
        }, this.timeout);
      }),
    ]);
  }

  /**
   * Execute a single attempt
   */
  private async executeSingleAttempt<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await this.executeWithTimeout(fn);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.executeSingleAttempt(fn);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(
            `[ResilientApiClient] Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay.toFixed(0)}ms`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Make an API call with retry, circuit breaker, and optional fallback.
   * 
   * @param fn - The function to execute
   * @param fallback - Optional fallback function if all retries fail
   * @returns The result from fn or fallback
   * 
   * @throws Error if circuit is open and no fallback provided
   */
  async call<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    this.metrics.totalCalls++;
    this.checkCircuitState();

    if (this.metrics.circuitState === 'open') {
      const error = new Error('Circuit breaker is open');
      console.error('[ResilientApiClient]', error.message);
      
      if (fallback) {
        console.log('[ResilientApiClient] Using fallback due to open circuit');
        try {
          return await fallback();
        } catch (fallbackError) {
          console.error('[ResilientApiClient] Fallback failed:', fallbackError);
          throw error;
        }
      }
      
      throw error;
    }

    try {
      const result = await this.executeWithRetry(fn);
      this.recordSuccess();
      return result;
    } catch (error) {
      console.error('[ResilientApiClient] All attempts failed:', error);
      this.recordFailure();

      if (fallback) {
        console.log('[ResilientApiClient] Using fallback after all retries failed');
        try {
          return await fallback();
        } catch (fallbackError) {
          console.error('[ResilientApiClient] Fallback failed:', fallbackError);
          throw error;
        }
      }

      throw error;
    }
  }
}
