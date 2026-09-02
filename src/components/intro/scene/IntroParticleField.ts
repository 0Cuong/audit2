// ============================================================================
// INTRO PARTICLE FIELD — FIXED: Absolute positioning (no cumulative mutation)
// Positions are computed from origin/target/progress each frame, never += deltas
// ============================================================================

import { INTRO_COLORS, type VariationSeedConfig } from '../config/introConfig';
import { type VirtualCameraState } from '../IntroController';

export interface IntroParticle {
  originX: number;
  originY: number;
  originZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  layer: 'foreground' | 'midground' | 'background' | 'far_background';
  baseSize: number;
  baseAlpha: number;
  color: string;
  orbitAngle: number;
  orbitSpeed: number;
  convergenceT: number; // 0→1 convergence progress (monotonic)
  delayOffset: number;
}

export class IntroParticleField {
  public particles: IntroParticle[] = [];
  private centerX = 0;
  private centerY = 0;

  public init(count: number, width: number, height: number, variation: VariationSeedConfig): void {
    this.centerX = width * 0.5;
    this.centerY = height * 0.46;
    this.particles = [];

    const ringRadius1 = Math.min(width, height) * 0.16;
    const ringRadius2 = ringRadius1 * 1.45;
    const ringRadius3 = ringRadius1 * 0.55;

    const colors = [
      INTRO_COLORS.goldPrimary,
      INTRO_COLORS.goldPrimary,
      INTRO_COLORS.violetSpectral,
      variation.accentHue === 'cyan_gold' ? INTRO_COLORS.cyanSpectral : INTRO_COLORS.violetSpectral,
      INTRO_COLORS.starlightWhite,
    ];

    for (let i = 0; i < count; i++) {
      let layer: IntroParticle['layer'] = 'midground';
      let depthZ = (Math.random() - 0.5) * 120;
      let baseSize = 0.8 + Math.random() * 1.5;
      let baseAlpha = 0.2 + Math.random() * 0.55;

      if (i < count * 0.15) {
        layer = 'foreground';
        depthZ = 80 + Math.random() * 80;
        baseSize = 1.4 + Math.random() * 1.8;
      } else if (i < count * 0.6) {
        layer = 'midground';
        depthZ = -20 + Math.random() * 60;
      } else if (i < count * 0.85) {
        layer = 'background';
        depthZ = -120 + Math.random() * 80;
        baseSize = 0.6 + Math.random() * 1.0;
        baseAlpha *= 0.75;
      } else {
        layer = 'far_background';
        depthZ = -240 + Math.random() * 100;
        baseSize = 0.4 + Math.random() * 0.8;
        baseAlpha *= 0.5;
      }

      const chaosAngle = Math.random() * Math.PI * 2;
      const chaosDist = 60 + Math.pow(Math.random(), 1.3) * (Math.max(width, height) * 0.7);
      const originX = this.centerX + Math.cos(chaosAngle) * chaosDist;
      const originY = this.centerY + Math.sin(chaosAngle) * chaosDist * 0.75;

      let targetX = this.centerX;
      let targetY = this.centerY;

      if (i < count * 0.45) {
        const tAngle = (i / (count * 0.45)) * Math.PI * 2;
        const tRadius = i % 2 === 0 ? ringRadius1 : ringRadius3;
        targetX = this.centerX + Math.cos(tAngle) * tRadius;
        targetY = this.centerY + Math.sin(tAngle) * tRadius * 0.95;
      } else if (i < count * 0.75) {
        const tAngle = (i / (count * 0.3)) * Math.PI * 2;
        const tRadius = ringRadius2 + (Math.random() - 0.5) * 20;
        targetX = this.centerX + Math.cos(tAngle) * tRadius;
        targetY = this.centerY + Math.sin(tAngle) * tRadius * 0.9;
      } else {
        const axisIndex = i % 4;
        const axisDist = (0.3 + Math.random() * 0.7) * ringRadius2 * 1.6;
        if (axisIndex === 0) { targetX = this.centerX; targetY = this.centerY - axisDist; }
        else if (axisIndex === 1) { targetX = this.centerX + axisDist; targetY = this.centerY; }
        else if (axisIndex === 2) { targetX = this.centerX; targetY = this.centerY + axisDist; }
        else { targetX = this.centerX - axisDist; targetY = this.centerY; }
      }

      this.particles.push({
        originX, originY, originZ: depthZ,
        targetX, targetY, targetZ: depthZ * 0.3,
        layer, baseSize, baseAlpha,
        color: colors[Math.floor(Math.random() * colors.length)],
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: (0.0015 + Math.random() * 0.003) * (Math.random() > 0.5 ? 1 : -1),
        convergenceT: 0,
        delayOffset: Math.random() * 0.3,
      });
    }
  }

  public resize(width: number, height: number): void {
    const oldCX = this.centerX;
    const oldCY = this.centerY;
    this.centerX = width * 0.5;
    this.centerY = height * 0.46;
    const dx = this.centerX - oldCX;
    const dy = this.centerY - oldCY;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.originX += dx; p.originY += dy;
      p.targetX += dx; p.targetY += dy;
    }
  }

  /**
   * Compute per-particle render position. ALL positions are absolute —
   * computed from origin, target, and progress. No cumulative mutation.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    cam: VirtualCameraState,
    enableLinks: boolean,
    enableBlur: boolean,
    state: string,
    phaseProgress: number,
    handoverProgress: number,
    time: number,
    dt: number
  ): void {
    const len = this.particles.length;
    if (len === 0) return;
    
    const timeScale = dt * 60;

    // Compute per-particle absolute positions for this frame
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];
      p.orbitAngle += p.orbitSpeed * timeScale;

      // Advance convergence monotonically (never goes backwards)
      if (state === 'DISTURBANCE' || state === 'DISCOVERY' || state === 'SCALE' ||
          state === 'RECOGNITION' || state === 'SILENCE' || state === 'SECONDARY_DISCOVERY' ||
          state === 'CAMERA_ENTRY' || state === 'HANDOVER' || state === 'ARRIVAL') {
        p.convergenceT = Math.min(1, p.convergenceT + 0.025 * timeScale);
      }
    }

    // Draw connecting filaments
    if (enableLinks) {
      for (let i = 0; i < len; i += 3) {
        for (let j = i + 1; j < len; j += 4) {
          const p1 = this.particles[i];
          const p2 = this.particles[j];
          const a1 = this.getAlpha(p1, state);
          const a2 = this.getAlpha(p2, state);
          if (a1 < 0.05 || a2 < 0.05) continue;

          const pos1 = this.getPosition(p1, state, phaseProgress, handoverProgress, cam, time);
          const pos2 = this.getPosition(p2, state, phaseProgress, handoverProgress, cam, time);

          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 60 * 60) {
            const lineAlpha = (1 - Math.sqrt(distSq) / 60) * 0.06;
            ctx.beginPath();
            ctx.moveTo(pos1.x, pos1.y);
            ctx.lineTo(pos2.x, pos2.y);
            ctx.strokeStyle = `rgba(229, 169, 60, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    // Draw particles
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];
      const alpha = this.getAlpha(p, state);
      if (alpha <= 0.005) continue;

      const pos = this.getPosition(p, state, phaseProgress, handoverProgress, cam, time);
      const size = Math.max(0.5, p.baseSize * (1 + pos.z * 0.002));

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${alpha.toFixed(3)})`;
      ctx.fill();

      if (enableBlur && p.layer === 'foreground' && alpha > 0.3) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${(alpha * 0.16).toFixed(3)})`;
        ctx.fill();
      }
    }
  }

  /** Compute absolute screen position for one particle (no mutation) */
  private getPosition(
    p: IntroParticle,
    state: string,
    _phaseProgress: number,
    handoverProgress: number,
    cam: VirtualCameraState,
    _time: number
  ): { x: number; y: number; z: number } {
    // Base: lerp from origin to target by convergence
    const t = this.easeInOut(p.convergenceT);
    let x = p.originX + (p.targetX - p.originX) * t;
    let y = p.originY + (p.targetY - p.originY) * t;
    let z = p.originZ + (p.targetZ - p.originZ) * t;

    // Orbital wobble when settled (scale smoothly by convergence to avoid snapping)
    const wobbleIntensity = Math.pow(Math.max(0, p.convergenceT - 0.5) * 2, 2); // 0 to 1 smoothly in second half of convergence
    if (wobbleIntensity > 0) {
      x += Math.cos(p.orbitAngle) * (2.5 * wobbleIntensity);
      y += Math.sin(p.orbitAngle) * (2.0 * wobbleIntensity);
    }

    // Lateral slide during handover (applied as offset, not mutation)
    if (state === 'CAMERA_ENTRY' || state === 'HANDOVER' || state === 'ARRIVAL') {
      const entry = handoverProgress > 0 ? handoverProgress : 0;
      x -= entry * 80 * (0.5 + Math.abs(z) * 0.005);
    }

    // Apply camera parallax
    const parallaxFactor = (z + 100) * 0.003;
    x -= cam.x * parallaxFactor;
    y -= cam.y * parallaxFactor;

    return { x, y, z };
  }

  /** Compute alpha for one particle based on state */
  private getAlpha(p: IntroParticle, state: string): number {
    if (state === 'VOID') {
      return p.layer === 'far_background' ? p.baseAlpha * 0.25 : 0;
    } else if (state === 'PRESENCE') {
      return (p.layer === 'background' || p.layer === 'far_background')
        ? p.baseAlpha * 0.45 : 0;
    } else if (state === 'CAMERA_ENTRY' || state === 'HANDOVER' || state === 'ARRIVAL') {
      return p.baseAlpha * Math.max(0, 1 - (state === 'ARRIVAL' ? 1 : state === 'HANDOVER' ? 0.75 : 0.3) * 0.85);
    } else {
      return p.baseAlpha;
    }
  }

  private easeInOut(t: number): number {
    return 0.5 - 0.5 * Math.cos(t * Math.PI);
  }

  // update() is now empty — all computation happens in render()
  public update(
    _time: number,
    _state: string,
    _phaseProgress: number,
    _handoverProgress: number
  ): void {
    // No-op: positions are computed absolutely in render()
  }
}
