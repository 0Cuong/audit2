// ============================================================================
// INTRO STATE MACHINE: "THE REVEAL — A WORLD THAT REVEALS ITSELF"
// Deterministic, idempotent, cancellable lifecycle manager for 10-Phase Sequence
// ============================================================================

export type IntroState =
  | 'IDLE'
  | 'PRELOADING'
  | 'VOID'                 // Phase 0: 0.00 → 0.90s (Absolute Void & Foreshadowing Layer 01)
  | 'PRESENCE'             // Phase 1: 0.75 → 1.70s (The Source Pinpoint & Wavefront)
  | 'DISTURBANCE'          // Phase 2: 1.50 → 2.60s (Illuminating Existing Structures)
  | 'DISCOVERY'            // Phase 3: 2.40 → 3.50s (Perspective Shift & Spatial Relation)
  | 'SCALE'                // Phase 4: 3.30 → 4.50s (Camera Pull-Back & Vast Monolith Reveal)
  | 'RECOGNITION'          // Phase 5: 4.30 → 5.20s (Geometric Alignment & Brand Discovery)
  | 'SILENCE'              // Phase 6: 5.15 → 5.75s (Motion Settle & Recognition Moment)
  | 'SECONDARY_DISCOVERY'  // Phase 7: 5.60 → 6.35s (Foreshadowing Payoff Movement)
  | 'CAMERA_ENTRY'         // Phase 8: 6.20 → 7.00s (Lateral Camera Advance Past Identity)
  | 'HANDOVER'             // Phase 9: 6.80 → 7.70s (Lighting/Particle/Grid Handover into Hero)
  | 'ARRIVAL'              // Phase 10: 7.60 → 8.50s (Final Settle & First Light in Hero Center)
  | 'ENTERED'              // Terminal state
  | 'SKIPPED'
  | 'FALLBACK';

export type StateChangeListener = (newState: IntroState, prevState: IntroState) => void;

export class IntroStateMachine {
  private currentState: IntroState = 'IDLE';
  private listeners: Set<StateChangeListener> = new Set();
  private isDestroyed = false;

  constructor(initialState: IntroState = 'IDLE') {
    this.currentState = initialState;
  }

  public getState(): IntroState {
    return this.currentState;
  }

  public isEntered(): boolean {
    return (
      this.currentState === 'ENTERED' ||
      this.currentState === 'SKIPPED' ||
      this.currentState === 'FALLBACK'
    );
  }

  public isActive(): boolean {
    return !this.isEntered() && this.currentState !== 'IDLE';
  }

  public transition(nextState: IntroState): boolean {
    if (this.isDestroyed) return false;
    if (this.currentState === nextState) return false;

    // Terminal state protection: once entered, do not transition backwards unless reset
    if (this.currentState === 'ENTERED' && nextState !== 'IDLE') {
      return false;
    }

    const prevState = this.currentState;
    this.currentState = nextState;

    this.listeners.forEach((listener) => {
      try {
        listener(nextState, prevState);
      } catch (err) {
        console.error('[IntroStateMachine] Error in state listener:', err);
      }
    });

    return true;
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public reset(): void {
    this.currentState = 'IDLE';
    this.isDestroyed = false;
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.listeners.clear();
  }
}
