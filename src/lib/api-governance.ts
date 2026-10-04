type RequestKey = string;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
  abortController?: AbortController;
}

interface GovernanceConfig {
  ttl?: number;
  retries?: number;
  baseDelay?: number;
  maxDelay?: number;
  concurrency?: number;
  minSpacing?: number;
}

const DEFAULT_CONFIG: GovernanceConfig = {
  ttl: 5 * 60 * 1000,
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

  public async fetchWithGovernance<T>(
    key: RequestKey,
    fetcher: (signal: AbortSignal) => Promise<T>,
    config: GovernanceConfig = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry?.promise) return entry.promise;

    if (entry && finalConfig.ttl && now - entry.timestamp < finalConfig.ttl) {
      return entry.data;
    }

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

          this.cache.set(key, { data, timestamp: Date.now() });
          this.releaseConcurrencyLimit();
          return data;
        } catch (error: any) {
          this.releaseConcurrencyLimit();

          if (
            error.name === 'AbortError' ||
            (error.status && error.status >= 400 && error.status < 500 && error.status !== 429)
          ) {
            throw error;
          }

          lastError = error;
          attempt++;

          if (attempt <= (finalConfig.retries || 0)) {
            const retryAfter = error.response?.headers?.get('Retry-After') || error.headers?.['retry-after'];
            await this.delay(attempt, retryAfter);
          }
        }
      }

      if (entry?.data) return entry.data;
      throw lastError;
    })();

    this.cache.set(key, {
      ...(entry || { data: null, timestamp: 0 }),
      promise,
      abortController
    });

    try {
      return await promise;
    } finally {
      const currentEntry = this.cache.get(key);
      if (currentEntry?.promise === promise) {
        this.cache.set(key, { data: currentEntry.data, timestamp: currentEntry.timestamp });
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
