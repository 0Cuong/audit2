// ============================================================================
// INTRO GEOMETRY ASSEMBLER: MULTI-DEPTH CELESTIAL STRUCTURES & FORESHADOWING
// Foreshadowing Arc, Observational Crosshairs, and Bento Grid Alignment
// ============================================================================

import { type VirtualCameraState } from '../IntroController';
import { type VariationSeedConfig } from '../config/introConfig';

export class IntroGeometryAssembler {
  public centerX = 0;
  public centerY = 0;
  public ringAngle = 0;
  public secondaryRingAngle = 0;

  public init(centerX: number, centerY: number): void {
    this.centerX = centerX;
    this.centerY = centerY;
    this.ringAngle = 0;
    this.secondaryRingAngle = 0;
  }

  public resize(centerX: number, centerY: number): void {
    this.centerX = centerX;
    this.centerY = centerY;
  }

  public update(dt: number, isWarp: boolean): void {
    const timeScale = dt * 60;
    this.ringAngle += (isWarp ? 0.03 : 0.0025) * timeScale;
    this.secondaryRingAngle -= (isWarp ? 0.045 : 0.0018) * timeScale;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: string,
    phaseProgress: number,
    handoverProgress: number,
    cam: VirtualCameraState,
    variation: VariationSeedConfig
  ): void {
    const baseRadius = Math.min(width, height) * 0.16;
    const r1 = baseRadius;
    const r2 = baseRadius * 1.45;
    const r3 = baseRadius * 0.55;

    ctx.save();
    // Translate with camera parallax
    ctx.translate(this.centerX - cam.x * 0.4, this.centerY - cam.y * 0.4);

    // ========================================================================
    // 1. FORESHADOWING LAYER 01 (Faint 1px Arc visible from Phase 0)
    // ========================================================================
    let arcAlpha = 0;
    if (state === 'VOID') {
      arcAlpha = 0.08 + phaseProgress * 0.08; // 0.08 -> 0.16
    } else if (state === 'PRESENCE') {
      arcAlpha = 0.16 + phaseProgress * 0.24; // 0.16 -> 0.40
    } else if (state === 'DISTURBANCE') {
      arcAlpha = 0.40 + phaseProgress * 0.20; // 0.40 -> 0.60
    } else if (state === 'DISCOVERY') {
      arcAlpha = 0.60 + phaseProgress * 0.20; // 0.60 -> 0.80
    } else if (state === 'SCALE') {
      arcAlpha = 0.80 + phaseProgress * 0.10; // 0.80 -> 0.90
    } else if (state === 'RECOGNITION' || state === 'SILENCE' || state === 'SECONDARY_DISCOVERY') {
      arcAlpha = 0.9;
    } else {
      arcAlpha = Math.max(0, 0.9 * (1 - handoverProgress));
    }

    if (arcAlpha > 0.01) {
      // Draw Foreshadowing Celestial Arc
      ctx.beginPath();
      ctx.arc(0, 0, r1, -0.3, Math.PI * 0.75);
      ctx.strokeStyle = `rgba(229, 169, 60, ${(arcAlpha * 0.45).toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Complete ring when established
      if (state !== 'VOID' && state !== 'PRESENCE') {
        ctx.beginPath();
        ctx.arc(0, 0, r1, Math.PI * 0.75, Math.PI * 1.7);
        ctx.strokeStyle = `rgba(229, 169, 60, ${(arcAlpha * 0.25).toFixed(3)})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }
    }

    // ========================================================================
    // 2. MIDGROUND ROTATING SEGMENTED HARMONIC RING
    // ========================================================================
    if (state !== 'VOID' && arcAlpha > 0.1) {
      ctx.save();
      ctx.rotate(this.ringAngle);
      const segments = 24;
      const step = (Math.PI * 2) / segments;
      ctx.strokeStyle = `rgba(229, 169, 60, ${(arcAlpha * 0.2).toFixed(3)})`;
      ctx.lineWidth = 0.75;

      for (let i = 0; i < segments; i++) {
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, r2, i * step, (i + 0.6) * step);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // ========================================================================
    // 3. SECONDARY DISCOVERY RING (Foreshadowing Payoff / Seed Beta & Delta)
    // ========================================================================
    const showSecondary =
      variation.earlyRingReveal ||
      state === 'SECONDARY_DISCOVERY' ||
      state === 'RECOGNITION' ||
      state === 'SILENCE';

    if (showSecondary && arcAlpha > 0.15) {
      ctx.save();
      ctx.rotate(this.secondaryRingAngle);
      ctx.beginPath();
      ctx.arc(0, 0, r3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(139, 92, 246, ${(arcAlpha * 0.28).toFixed(3)})`;
      ctx.lineWidth = 0.75;
      ctx.setLineDash([3, 7]);
      ctx.stroke();
      ctx.restore();
    }

    // ========================================================================
    // 4. OBSERVATION CROSSHAIRS & BENTO GRID ALIGNMENT TICKS
    // ========================================================================
    if (
      state === 'DISTURBANCE' ||
      state === 'DISCOVERY' ||
      state === 'SCALE' ||
      state === 'RECOGNITION' ||
      state === 'SILENCE' ||
      state === 'SECONDARY_DISCOVERY'
    ) {
      const crossLength = r2 * 1.35;
      ctx.strokeStyle = `rgba(244, 244, 245, ${(arcAlpha * 0.14).toFixed(3)})`;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 10]);

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(-crossLength, 0);
      ctx.lineTo(crossLength, 0);
      ctx.stroke();

      // Vertical
      ctx.beginPath();
      ctx.moveTo(0, -crossLength);
      ctx.lineTo(0, crossLength);
      ctx.stroke();

      // Coordinate Ticks
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(229, 169, 60, ${(arcAlpha * 0.3).toFixed(3)})`;
      const tickSize = 4;
      ctx.beginPath();
      ctx.moveTo(r1 - tickSize, 0);
      ctx.lineTo(r1 + tickSize, 0);
      ctx.moveTo(-r1 - tickSize, 0);
      ctx.lineTo(-r1 + tickSize, 0);
      ctx.moveTo(0, r1 - tickSize);
      ctx.lineTo(0, r1 + tickSize);
      ctx.moveTo(0, -r1 - tickSize);
      ctx.lineTo(0, -r1 + tickSize);
      ctx.stroke();
    }

    // ========================================================================
    // 5. HIDDEN DETAIL B: EDGE GLINT REFLECTION (Micro-event during Discovery)
    // ========================================================================
    if (state === 'DISCOVERY' && phaseProgress > 0.4 && phaseProgress < 0.75) {
      const glintAlpha = Math.sin((phaseProgress - 0.4) * Math.PI * 2.8) * 0.35;
      if (glintAlpha > 0.01) {
        ctx.beginPath();
        ctx.moveTo(r2 * 0.9, -r2 * 0.4);
        ctx.lineTo(r2 * 1.15, -r2 * 0.2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${glintAlpha.toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
