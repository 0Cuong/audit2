// ============================================================================
// INTRO ACCESSIBILITY HANDLER
// Prefers-reduced-motion, keyboard interactions, and screen-reader announcements
// ============================================================================

export class IntroAccessibility {
  private static mediaQueryList: MediaQueryList | null = null;
  private static motionListeners: Set<(reduced: boolean) => void> = new Set();

  public static init(): void {
    if (typeof window === 'undefined') return;

    this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      this.motionListeners.forEach((fn) => fn(e.matches));
    };

    if (this.mediaQueryList.addEventListener) {
      this.mediaQueryList.addEventListener('change', handler);
    }
  }

  public static isReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  public static onReducedMotionChange(fn: (reduced: boolean) => void): () => void {
    this.motionListeners.add(fn);
    return () => {
      this.motionListeners.delete(fn);
    };
  }

  /**
   * Accessible live announcement for screen readers
   */
  public static announce(message: string): void {
    if (typeof document === 'undefined') return;
    let announcer = document.getElementById('intro-a11y-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'intro-a11y-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.style.cssText =
        'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
      document.body.appendChild(announcer);
    }
    announcer.textContent = message;
  }

  public static cleanup(): void {
    this.motionListeners.clear();
    const announcer = document.getElementById('intro-a11y-announcer');
    if (announcer && announcer.parentNode) {
      announcer.parentNode.removeChild(announcer);
    }
  }
}
