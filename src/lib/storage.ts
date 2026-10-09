/**
 * Safe LocalStorage Utility
 * Prevents JSON parsing exceptions, storage quota crashes, and corrupted data deadlocks.
 */

export function safeGetStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === '' || raw === 'undefined') {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`[Storage] Corrupted or invalid JSON for key "${key}", falling back to default.`, error);
    return fallback;
  }
}

export function safeSetStorage<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[Storage] Failed to save key "${key}" to localStorage.`, error);
    return false;
  }
}

export function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn(`[Storage] Failed to remove key "${key}".`, error);
  }
}
