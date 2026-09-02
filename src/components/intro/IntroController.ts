// ============================================================================
// INTRO CONTROLLER: 10-PHASE MASTER TIMELINE
// NO OWN RAF LOOP. Called by the single Canvas RAF loop via update(now).
// ============================================================================

import { INTRO_TIMING, type VariationSeedConfig } from './config/introConfig';
import { IntroStateMachine, type IntroState } from './IntroStateMachine';
import { type PlaybackMode } from './IntroStorage';

export interface VirtualCameraState {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  fov: number;
}

export interface IntroProgressSnapshot {
  state: IntroState;
  timelineProgress: number;
  phaseProgress: number;
  handoverProgress: number;
  camera: VirtualCameraState;
  sourceLight: { x: number; y: number; z: number; intensity: number; scale: number };
  isSkipping: boolean;
  elapsed: number;
  completed: boolean;
}

const MAX_DELTA_SECONDS = 0.05;

export class IntroController {
  private stateMachine: IntroStateMachine;
  private isReducedMotion: boolean;
  private variation: VariationSeedConfig;
  private totalDuration = 8.50;
  private isSkipping = false;
  private skipAccumulated = 0;
  private lastFrameTime = 0;
  private accumulatedElapsed = 0;
  private started = false;
  private _completed = false;

  // Pre-allocated mutable snapshot
  public readonly snapshot: IntroProgressSnapshot = {
    state: 'PRELOADING',
    timelineProgress: 0,
    phaseProgress: 0,
    handoverProgress: 0,
    camera: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, fov: 60 },
    sourceLight: { x: 0, y: 0, z: 0, intensity: 0, scale: 1 },
    isSkipping: false,
    elapsed: 0,
    completed: false,
  };

  private timings: typeof INTRO_TIMING.MASTER;

  constructor(
    stateMachine: IntroStateMachine,
    playbackMode: PlaybackMode,
    isReducedMotion: boolean,
    variation: VariationSeedConfig
  ) {
    this.stateMachine = stateMachine;
    this.isReducedMotion = isReducedMotion;
    this.variation = variation;

    if (this.isReducedMotion) {
      this.totalDuration = INTRO_TIMING.REDUCED_MOTION.totalDuration;
      this.timings = INTRO_TIMING.REDUCED_MOTION;
    } else if (playbackMode === 'REPLAY' || playbackMode === 'FIRST_VISIT') {
      this.totalDuration = INTRO_TIMING.MASTER.totalDuration;
      this.timings = INTRO_TIMING.MASTER;
    } else {
      this.totalDuration = INTRO_TIMING.RETURN_VISIT.totalDuration;
      this.timings = INTRO_TIMING.RETURN_VISIT;
    }
  }

  public start(): void {
    this.lastFrameTime = performance.now();
    this.accumulatedElapsed = 0;
    this.started = true;
    this._completed = false;
    this.stateMachine.transition('VOID');
  }

  public skip(): void {
    if (this.isSkipping || this._completed) return;
    this.isSkipping = true;
    this.skipAccumulated = 0;
    this.stateMachine.transition('HANDOVER');
  }

  public isCompleted(): boolean {
    return this._completed;
  }

  public isStarted(): boolean {
    return this.started;
  }

  public getLastFrameTime(): number {
    return this.lastFrameTime;
  }

  public isStalled(): boolean {
    if (!this.started || this._completed) return false;
    return performance.now() - this.lastFrameTime > 3000;
  }

  /**
   * Called once per frame by the single Canvas RAF loop.
   * Returns the current state name.
   */
  public update(now: number): IntroState {
    if (this._completed) return 'ENTERED';
    if (!this.started) return 'PRELOADING';

    const rawDelta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    const delta = Math.max(0, Math.min(rawDelta, MAX_DELTA_SECONDS));

    // Pause while tab is hidden
    if (typeof document !== 'undefined' && document.hidden) {
      return this.stateMachine.getState();
    }

    const timings = this.timings;
    let handoverProgress = 0;

    if (this.isSkipping) {
      this.skipAccumulated += delta;
      const skipRatio = Math.min(1, this.skipAccumulated / INTRO_TIMING.skipTransitionDuration);
      handoverProgress = skipRatio;
      if (skipRatio >= 1) {
        this.complete();
        return 'ENTERED';
      }
    } else {
      this.accumulatedElapsed += delta;
      const elapsed = this.accumulatedElapsed;

      let targetState: IntroState = 'VOID';
      if (elapsed < timings.presence.start) {
        targetState = 'VOID';
      } else if (elapsed < timings.disturbance.start) {
        targetState = 'PRESENCE';
      } else if (elapsed < timings.discovery.start) {
        targetState = 'DISTURBANCE';
      } else if (elapsed < timings.scale.start) {
        targetState = 'DISCOVERY';
      } else if (elapsed < timings.recognition.start) {
        targetState = 'SCALE';
      } else if (elapsed < timings.silence.start) {
        targetState = 'RECOGNITION';
      } else if (elapsed < timings.secondaryDiscovery.start) {
        targetState = 'SILENCE';
      } else if (elapsed < timings.cameraEntry.start) {
        targetState = 'SECONDARY_DISCOVERY';
      } else if (elapsed < timings.handover.start) {
        targetState = 'CAMERA_ENTRY';
      } else if (elapsed < timings.arrival.start) {
        targetState = 'HANDOVER';
        handoverProgress = Math.min(1, (elapsed - timings.handover.start) / timings.handover.duration);
      } else if (elapsed < this.totalDuration) {
        targetState = 'ARRIVAL';
        handoverProgress = 1;
      } else {
        this.complete();
        return 'ENTERED';
      }

      if (this.stateMachine.getState() !== targetState) {
        this.stateMachine.transition(targetState);
      }
    }

    const currentState = this.stateMachine.getState();
    const elapsed = this.accumulatedElapsed;
    let phaseProgress = 0;

    if (currentState === 'VOID') {
      phaseProgress = elapsed / timings.void.duration;
    } else if (currentState === 'PRESENCE') {
      phaseProgress = (elapsed - timings.presence.start) / timings.presence.duration;
    } else if (currentState === 'DISTURBANCE') {
      phaseProgress = (elapsed - timings.disturbance.start) / timings.disturbance.duration;
    } else if (currentState === 'DISCOVERY') {
      phaseProgress = (elapsed - timings.discovery.start) / timings.discovery.duration;
    } else if (currentState === 'SCALE') {
      phaseProgress = (elapsed - timings.scale.start) / timings.scale.duration;
    } else if (currentState === 'RECOGNITION') {
      phaseProgress = (elapsed - timings.recognition.start) / timings.recognition.duration;
    } else if (currentState === 'SILENCE') {
      phaseProgress = (elapsed - timings.silence.start) / timings.silence.duration;
    } else if (currentState === 'SECONDARY_DISCOVERY') {
      phaseProgress = (elapsed - timings.secondaryDiscovery.start) / timings.secondaryDiscovery.duration;
    } else if (currentState === 'CAMERA_ENTRY') {
      phaseProgress = (elapsed - timings.cameraEntry.start) / timings.cameraEntry.duration;
    } else if (currentState === 'HANDOVER') {
      phaseProgress = (elapsed - timings.handover.start) / timings.handover.duration;
    } else if (currentState === 'ARRIVAL') {
      phaseProgress = (elapsed - timings.arrival.start) / timings.arrival.duration;
    }

    const timelineProgress = Math.min(1, elapsed / this.totalDuration);

    // Update snapshot in place
    const s = this.snapshot;
    s.state = currentState;
    s.timelineProgress = Math.max(0, Math.min(1, timelineProgress));
    s.phaseProgress = Math.max(0, Math.min(1, phaseProgress));
    s.handoverProgress = Math.max(0, Math.min(1, handoverProgress));
    s.isSkipping = this.isSkipping;
    s.elapsed = elapsed;
    s.completed = false;

    this.updateCamera(s.camera, elapsed, timelineProgress, handoverProgress);
    this.updateLight(s.sourceLight, elapsed, timelineProgress, handoverProgress);

    return currentState;
  }

  private updateCamera(
    cam: VirtualCameraState,
    elapsed: number,
    t: number,
    handover: number
  ): void {
    const so = this.variation.cameraOffset;
    if (this.isReducedMotion) {
      cam.x = 0; cam.y = 0; cam.z = 0;
      cam.yaw = 0; cam.pitch = 0; cam.roll = 0; cam.fov = 60;
      return;
    }

    let cx = so.x, cy = so.y, cz = so.z;
    let yaw = so.yaw, pitch = so.pitch, roll = 0, fov = 60;
    const timings = this.timings;

    // Phase 0-1: VOID & PRESENCE (0.00 -> 1.50)
    if (elapsed < timings.disturbance.start) {
      cx += Math.sin(t * 0.8) * 8;
      cy += Math.cos(t * 0.6) * 6;
      cz = -50 + t * 15;
    } 
    // Phase 2-4: DISTURBANCE, DISCOVERY, SCALE (1.50 -> 4.30)
    else if (elapsed < timings.recognition.start) {
      const macroStart = timings.disturbance.start;
      const macroDuration = timings.recognition.start - macroStart;
      const macroProgress = (elapsed - macroStart) / macroDuration; // 0 to 1 smoothly
      
      const slide = 0.5 - 0.5 * Math.cos(macroProgress * Math.PI);
      cx += -40 + slide * 70;
      cy += Math.sin(t * 1.2) * 8;
      yaw += (slide - 0.5) * 0.08;
      
      // Pull back in Z smoothly
      const pull = Math.pow(macroProgress, 1.5);
      cz = -20 + pull * 60; 
      
      if (macroProgress > 0.6) {
        const scalePull = (macroProgress - 0.6) / 0.4;
        cx *= (1 - scalePull * 0.5);
        cy *= (1 - scalePull * 0.5);
        yaw *= (1 - scalePull * 0.7);
        fov = 60 + scalePull * 8;
      }
    } 
    // Phase 5-7: RECOGNITION, SILENCE, SECONDARY_DISCOVERY (4.30 -> 6.80)
    else if (elapsed < timings.handover.start) {
      cx = 0; cy = 0; cz = 40 + Math.sin(t * 1.5) * 3;
      yaw = 0; pitch = 0; fov = 68;
    } 
    // Phase 8-10: CAMERA_ENTRY, HANDOVER, ARRIVAL
    else {
      const entryStart = timings.handover.start;
      // Smoothly accelerate from 0 to 1 during handover
      const entryProgress = handover > 0 ? handover : Math.max(0, (elapsed - entryStart) / timings.handover.duration);
      const se = Math.pow(entryProgress, 1.6);
      
      cx = se * 120; cy = -se * 40; cz = 40 - se * 120;
      yaw = se * 0.12; roll = -se * 0.04; fov = 68 - se * 8;
    }

    cam.x = cx; cam.y = cy; cam.z = cz;
    cam.yaw = yaw; cam.pitch = pitch; cam.roll = roll; cam.fov = fov;
  }

  private updateLight(
    l: { x: number; y: number; z: number; intensity: number; scale: number },
    elapsed: number,
    t: number,
    handover: number
  ): void {
    l.x = 0; l.y = 0; l.z = 0;
    const timings = this.timings;

    if (elapsed < timings.presence.start) {
      l.intensity = 0; l.scale = 1;
    } else if (elapsed < timings.disturbance.start) {
      const p = (elapsed - timings.presence.start) / timings.presence.duration;
      const pulse = Math.sin(p * Math.PI * 4) * 0.5 + 0.5;
      l.intensity = Math.min(1, p * 0.6 + pulse * 0.4);
      l.scale = 1 + pulse * 0.8;
    } else if (elapsed < timings.recognition.start) {
      l.intensity = 0.85 + Math.sin(t * 3) * 0.15;
      l.scale = 1.2;
    } else if (elapsed < timings.handover.start) {
      l.intensity = 1.0; l.scale = 1.4;
    } else {
      const entryStart = timings.handover.start;
      const entryProgress = handover > 0 ? handover : Math.max(0, (elapsed - entryStart) / timings.handover.duration);
      l.intensity = Math.max(0.4, 1.0 - entryProgress * 0.4);
      l.scale = 1.4 + entryProgress * 3.0;
      l.x = -entryProgress * 40; l.y = entryProgress * 20;
    }
  }

  private complete(): void {
    this._completed = true;
    this.snapshot.completed = true;
    this.snapshot.state = 'ENTERED';
    this.stateMachine.transition('ENTERED');
  }

  public destroy(): void {
    // No RAF to cancel — we have no own loop
    this._completed = true;
  }
}
