// ============================================================================
// INTRO VARIATION ENGINE
// Manages authored director variations, deterministic seed selection, and replay memory
// ============================================================================

import {
  type VariationSeedId,
  type VariationSeedConfig,
  VARIATION_SEEDS,
} from './config/introConfig';
import { safeGetStorage, safeSetStorage } from '../../lib/storage';

const SEED_STORAGE_KEY = 'cuongisme_intro_last_seed';
const SEED_HISTORY_KEY = 'cuongisme_intro_seed_history';

export class IntroVariationEngine {
  private static activeSeed: VariationSeedConfig = VARIATION_SEEDS.SEED_ALPHA;

  /**
   * Determine the variation seed for the current playback session
   * Based on visit count and weighted probability
   */
  public static selectSeed(visitCount: number, forceSeed?: VariationSeedId): VariationSeedConfig {
    if (forceSeed && VARIATION_SEEDS[forceSeed]) {
      this.activeSeed = VARIATION_SEEDS[forceSeed];
      return this.activeSeed;
    }

    // First visit always gets SEED_ALPHA (The pristine, classic master cut)
    if (visitCount <= 1) {
      this.activeSeed = VARIATION_SEEDS.SEED_ALPHA;
      this.saveLastSeed('SEED_ALPHA');
      return this.activeSeed;
    }

    // For repeat visits & replays: Weighted director selection
    const rand = Math.random();
    let selectedId: VariationSeedId = 'SEED_ALPHA';

    if (rand < 0.05) {
      selectedId = 'SEED_DELTA'; // 5% Rare Pulsar
    } else if (rand < 0.25) {
      selectedId = 'SEED_GAMMA'; // 20% Deep Monoliths
    } else if (rand < 0.55) {
      selectedId = 'SEED_BETA'; // 30% Observational Quadrant
    } else {
      selectedId = 'SEED_ALPHA'; // 45% Classic
    }

    // Ensure we don't repeat the exact same non-primary seed twice in a row if possible
    const lastSeedId = safeGetStorage<VariationSeedId>(SEED_STORAGE_KEY, 'SEED_ALPHA');
    if (selectedId === lastSeedId && selectedId !== 'SEED_ALPHA') {
      selectedId = 'SEED_ALPHA';
    }

    this.activeSeed = VARIATION_SEEDS[selectedId];
    this.saveLastSeed(selectedId);
    return this.activeSeed;
  }

  public static getActiveSeed(): VariationSeedConfig {
    return this.activeSeed;
  }

  private static saveLastSeed(seedId: VariationSeedId): void {
    safeSetStorage(SEED_STORAGE_KEY, seedId);
    const history = safeGetStorage<string[]>(SEED_HISTORY_KEY, []);
    safeSetStorage(SEED_HISTORY_KEY, [seedId, ...history.slice(0, 10)]);
  }
}
