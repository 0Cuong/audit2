// ============================================================================
// CRITICAL ASSET REGISTRY & PRELOADER
// Failsafe asynchronous preloading for typography, media, and core shaders
// ============================================================================

import { INTRO_TIMING } from './config/introConfig';

export type AssetPriority = 'CRITICAL' | 'OPTIONAL' | 'NON_BLOCKING';
export type AssetState = 'pending' | 'loading' | 'ready' | 'failed';

export interface RegisteredAsset {
  id: string;
  type: 'font' | 'image' | 'data';
  src: string;
  priority: AssetPriority;
  state: AssetState;
}

export class IntroAssetLoader {
  private static registry: Map<string, RegisteredAsset> = new Map();

  /**
   * Register essential fonts and media assets for preloading
   */
  public static initDefaultRegistry(): void {
    this.registry.clear();

    // 1. Critical Fonts
    this.register('font-cinzel', 'font', 'Cinzel', 'CRITICAL');
    this.register('font-newsreader', 'font', 'Newsreader', 'CRITICAL');
    this.register('font-jakarta', 'font', 'Plus Jakarta Sans', 'CRITICAL');
    this.register('font-mono', 'font', 'JetBrains Mono', 'OPTIONAL');

    // 2. Critical Partner Media
    this.register('img-p1', 'image', '/590610904_1909263110009109_2160755825373491978_n.jpg', 'OPTIONAL');
    this.register('img-p2', 'image', '/605572670_122215932062047100_7842864668271503382_n.jpg', 'OPTIONAL');
  }

  public static register(id: string, type: 'font' | 'image' | 'data', src: string, priority: AssetPriority): void {
    this.registry.set(id, {
      id,
      type,
      src,
      priority,
      state: 'pending',
    });
  }

  /**
   * Preloads all registered assets with strict timeout guard
   */
  public static async preloadAll(): Promise<{ success: boolean; readyCount: number; total: number }> {
    this.initDefaultRegistry();

    const promises: Promise<void>[] = [];
    const criticalPromises: Promise<void>[] = [];

    this.registry.forEach((asset) => {
      asset.state = 'loading';
      const promise = this.loadSingleAsset(asset);
      promises.push(promise);
      if (asset.priority === 'CRITICAL') {
        criticalPromises.push(promise);
      }
    });

    // Create a strict timeout promise
    const softTimeoutPromise = new Promise<void>((resolve) => {
      setTimeout(resolve, INTRO_TIMING.assetSoftTimeoutMs);
    });

    // Await all critical promises, or soft timeout, whichever comes first
    try {
      await Promise.race([
        Promise.allSettled(criticalPromises),
        softTimeoutPromise,
      ]);
    } catch {
      // Ignore errors and proceed
    }

    let readyCount = 0;
    this.registry.forEach((a) => {
      if (a.state === 'ready') readyCount++;
    });

    return {
      success: true,
      readyCount,
      total: this.registry.size,
    };
  }

  private static async loadSingleAsset(asset: RegisteredAsset): Promise<void> {
    try {
      if (asset.type === 'font') {
        if (typeof document !== 'undefined' && 'fonts' in document) {
          // Check if font is already loaded or load it
          await document.fonts.load(`16px "${asset.src}"`);
          asset.state = 'ready';
        } else {
          asset.state = 'ready';
        }
      } else if (asset.type === 'image') {
        if (typeof Image !== 'undefined') {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              asset.state = 'ready';
              resolve();
            };
            img.onerror = () => {
              asset.state = 'failed';
              resolve(); // Don't reject, soft fail
            };
            img.src = asset.src;
          });
        } else {
          asset.state = 'ready';
        }
      }
    } catch {
      asset.state = 'failed';
    }
  }
}
