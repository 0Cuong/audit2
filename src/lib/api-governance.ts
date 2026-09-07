import { isSupabaseConfigured } from './supabase';

type RequestKey = string;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
  abortController?: AbortController;
}

interface GovernanceConfig {
  ttl?: number; // Cache time-to-live in ms
  retries?: number;
  baseDelay?: number;
  maxDelay?: number;
  concurrency?: number;
  minSpacing?: number; // Minimum ms between requests of the same key
}

const DEFAULT_CONFIG: GovernanceConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes default
  retries: 3,
  baseDelay: 500,
  maxDelay: 5000,
  concurrency: 4,
};

class RequestGovernanceLayer {
  private cache = new Map<RequestKey, CacheEntry<any>>();
  private activeRequests = 0;
  private queue: Array<() => void> = [];
  private lastRequestTime = new Map<RequestKey, number>();

  /**
   * Exponential backoff with jitter and Retry-After support
   */
  private async delay(attempt: number, retryAfterHeader?: string | null) {
    if (retryAfterHeader) {
      const parsed = parseInt(retryAfterHeader, 10);
      if (!isNaN(parsed)) {
        await new Promise((resolve) => setTimeout(resolve, parsed * 1000));
        return;
      }
    }
    const base = 500;
    const max = 2000;
    const exponential = Math.min(max, base * Math.pow(2, attempt));
    const jitter = Math.random() * 200;
    await new Promise((resolve) => setTimeout(resolve, exponential + jitter));
  }

  /**
   * Concurrency Limiter
   */
  private async acquireConcurrencyLimit(maxConcurrent = 4) {
    if (this.activeRequests < maxConcurrent) {
      this.activeRequests++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.activeRequests++;
        resolve();
      });
    });
  }

  private releaseConcurrencyLimit() {
    this.activeRequests--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  /**
   * Fetch with Governance: Cache, Deduplication, Retry, Stale-While-Revalidate
   */
  public async fetchWithGovernance<T>(
    key: RequestKey,
    fetcher: (signal: AbortSignal) => Promise<T>,
    config: GovernanceConfig = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const entry = this.cache.get(key);
    const now = Date.now();

    // 1. In-flight Deduplication
    if (entry?.promise) {
      return entry.promise;
    }

    // 2. Cache Return (Stale-while-revalidate or fresh)
    if (entry && finalConfig.ttl && now - entry.timestamp < finalConfig.ttl) {
      return entry.data;
    }

    // 3. Minimum spacing logic (e.g., Nominatim)
    if (finalConfig.minSpacing) {
      const lastReq = this.lastRequestTime.get(key) || 0;
      const timeSinceLast = now - lastReq;
      if (timeSinceLast < finalConfig.minSpacing) {
        await new Promise((res) => setTimeout(res, finalConfig.minSpacing! - timeSinceLast));
      }
    }

    const abortController = new AbortController();

    const promise = (async () => {
      let attempt = 0;
      let lastError: any;

      while (attempt <= (finalConfig.retries || 0)) {
        try {
          await this.acquireConcurrencyLimit(finalConfig.concurrency);
          this.lastRequestTime.set(key, Date.now());

          const data = await fetcher(abortController.signal);
          
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
          });
          
          this.releaseConcurrencyLimit();
          return data;
        } catch (error: any) {
          this.releaseConcurrencyLimit();
          
          // Don't retry AbortError or Validation errors (400, 403, 404)
          if (
            error.name === 'AbortError' || 
            (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) ||
            !isSupabaseConfigured // Offline mode short-circuit
          ) {
            throw error;
          }

          lastError = error;
          attempt++;

          if (attempt <= (finalConfig.retries || 0)) {
            // Check for Retry-After header if the error includes response headers
            const retryAfter = error.response?.headers?.get('Retry-After') || error.headers?.['retry-after'];
            await this.delay(attempt, retryAfter);
          }
        }
      }

      // If we fall through and have stale cache, return it rather than failing
      if (entry?.data) {
        return entry.data;
      }

      throw lastError;
    })();

    this.cache.set(key, {
      ...(entry || { data: null, timestamp: 0 }),
      promise,
      abortController
    });

    try {
      const data = await promise;
      return data;
    } finally {
      const currentEntry = this.cache.get(key);
      if (currentEntry?.promise === promise) {
        this.cache.set(key, {
          data: currentEntry.data,
          timestamp: currentEntry.timestamp,
        });
      }
    }
  }

  public invalidate(key: RequestKey | ((k: RequestKey) => boolean)) {
    if (typeof key === 'function') {
      for (const k of this.cache.keys()) {
        if (key(k)) this.cache.delete(k);
      }
    } else {
      this.cache.delete(key);
    }
  }

  public abort(key: RequestKey) {
    const entry = this.cache.get(key);
    if (entry?.abortController) {
      entry.abortController.abort();
      this.cache.delete(key);
    }
  }
}

export const apiGovernance = new RequestGovernanceLayer();
