// ============================================================================
// INTRO PERFORMANCE & ADAPTIVE QUALITY ENGINE
// Dynamic hardware detection, WebGL/Canvas heuristics, and FPS guard
// ============================================================================

import { QualityTier, INTRO_PARTICLES } from './config/introConfig';

export interface PerformanceProfile {
  tier: QualityTier;
  particleCount: number;
  enableLinks: boolean;
  enableBlur: boolean;
  dpr: number;
  isMobile: boolean;
  isWebGLSupported: boolean;
  prefersReducedMotion: boolean;
}

export class IntroPerformance {
  private static cachedProfile: PerformanceProfile | null = null;

  public static getProfile(): PerformanceProfile {
    if (this.cachedProfile) {
      return this.cachedProfile;
    }

    if (typeof window === 'undefined') {
      return {
        tier: 'MEDIUM',
        particleCount: 60,
        enableLinks: false,
        enableBlur: false,
        dpr: 1,
        isMobile: false,
        isWebGLSupported: false,
        prefersReducedMotion: false,
      };
    }

    const isMobile =
      window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const concurrency = navigator.hardwareConcurrency || 4;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

    // Test WebGL capability safely
    let isWebGLSupported = false;
    try {
      const testCanvas = document.createElement('canvas');
      isWebGLSupported = !!(
        window.WebGLRenderingContext &&
        (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
      );
    } catch {
      isWebGLSupported = false;
    }

    // Determine Quality Tier
    let tier: QualityTier = 'HIGH';

    if (prefersReducedMotion) {
      tier = 'LOW';
    } else if (isMobile) {
      tier = concurrency >= 6 ? 'HIGH' : concurrency >= 4 ? 'MEDIUM' : 'LOW';
    } else {
      if (concurrency >= 8 && isWebGLSupported) {
        tier = 'ULTRA';
      } else if (concurrency >= 4) {
        tier = 'HIGH';
      } else if (concurrency >= 2) {
        tier = 'MEDIUM';
      } else {
        tier = 'LOW';
      }
    }

    const config = INTRO_PARTICLES[tier];

    this.cachedProfile = {
      tier,
      particleCount: isMobile ? Math.floor(config.count * 0.6) : config.count,
      enableLinks: config.links && !isMobile,
      enableBlur: config.blur && !isMobile,
      dpr,
      isMobile,
      isWebGLSupported,
      prefersReducedMotion,
    };

    return this.cachedProfile;
  }

  /**
   * Clears cached profile (e.g. if window resized or re-tested)
   */
  public static resetProfile(): void {
    this.cachedProfile = null;
  }
}
