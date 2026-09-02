// ============================================================================
// INTRO STORAGE & REPLAY MEMORY
// Visit counting, session tracking, and explicit playback mode resolution
// ============================================================================

import { safeGetStorage, safeSetStorage } from '../../lib/storage';

export type PlaybackMode = 'FIRST_VISIT' | 'REPLAY' | 'RETURN_VISIT';

const SESSION_KEY = 'cuongisme_intro_visited';
const PERSIST_VISIT_COUNT = 'cuongisme_intro_total_views';
const REPLAY_COUNT_KEY = 'cuongisme_intro_replay_count';

export class IntroStorage {
  public static isFirstVisit(): boolean {
    if (typeof window === 'undefined') return true;
    try {
      const visited = sessionStorage.getItem(SESSION_KEY);
      return visited === null;
    } catch {
      return true;
    }
  }

  public static getPlaybackMode(forceReplay: boolean): PlaybackMode {
    if (forceReplay) {
      return 'REPLAY';
    }
    return this.isFirstVisit() ? 'FIRST_VISIT' : 'RETURN_VISIT';
  }

  public static getVisitCount(): number {
    return safeGetStorage<number>(PERSIST_VISIT_COUNT, 0);
  }

  public static markVisited(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
      const count = safeGetStorage<number>(PERSIST_VISIT_COUNT, 0);
      safeSetStorage(PERSIST_VISIT_COUNT, count + 1);
    } catch (e) {
      // Safe fallback
    }
  }

  public static incrementReplay(): number {
    const count = safeGetStorage<number>(REPLAY_COUNT_KEY, 0) + 1;
    safeSetStorage(REPLAY_COUNT_KEY, count);
    return count;
  }

  public static resetSession(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {
      // Safe fallback
    }
  }
}
