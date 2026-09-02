// ============================================================================
// INTRO CANVAS SCENE: THE SINGLE MASTER RAF LOOP
// Drives both IntroController.update() and canvas rendering in one unified loop.
// ============================================================================

import { useEffect, useRef, memo } from 'react';
import { IntroSignalEmitter } from './IntroSignalEmitter';
import { IntroParticleField } from './IntroParticleField';
import { IntroGeometryAssembler } from './IntroGeometryAssembler';
import { IntroPerformance, type PerformanceProfile } from '../IntroPerformance';
import { type IntroController } from '../IntroController';
import { type VariationSeedConfig } from '../config/introConfig';

interface IntroCanvasSceneProps {
  controllerRef: React.MutableRefObject<IntroController | null>;
  variation: VariationSeedConfig;
  onStateChange: (state: string) => void;
  onComplete: () => void;
}

export const IntroCanvasScene = memo(function IntroCanvasScene({
  controllerRef,
  variation,
  onStateChange,
  onComplete,
}: IntroCanvasSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onStateChangeRef = useRef(onStateChange);
  const onCompleteRef = useRef(onComplete);
  onStateChangeRef.current = onStateChange;
  onCompleteRef.current = onComplete;

  const variationRef = useRef(variation);
  variationRef.current = variation;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const profile: PerformanceProfile = IntroPerformance.getProfile();
    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let destroyed = false;
    let lastReportedState = '';

    const activeVariation = variationRef.current;

    const signalEmitter = new IntroSignalEmitter();
    const particleField = new IntroParticleField();
    const geometryAssembler = new IntroGeometryAssembler();

    signalEmitter.init(width * 0.5, height * 0.46);
    particleField.init(profile.particleCount, width, height, activeVariation);
    geometryAssembler.init(width * 0.5, height * 0.46);

    const applySize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, profile.isMobile ? 1.25 : 1.75);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      signalEmitter.resize(width * 0.5, height * 0.46);
      particleField.resize(width, height);
      geometryAssembler.resize(width * 0.5, height * 0.46);
    };

    applySize();
    window.addEventListener('resize', applySize, { passive: true });

    let time = 0;
    let lastRenderTime = 0;

    const render = (now: number) => {
      if (destroyed) return;
      
      let dt = 0;
      if (lastRenderTime === 0) {
        dt = 0.016;
      } else {
        dt = Math.min((now - lastRenderTime) / 1000, 0.05);
      }
      lastRenderTime = now;
      time += dt;

      const controller = controllerRef.current;
      if (!controller || !controller.isStarted()) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // === SINGLE SOURCE OF TRUTH: drive controller from here ===
      const newState = controller.update(now);

      // Report state changes to React (rare — ~10 times total)
      if (newState !== lastReportedState) {
        lastReportedState = newState;
        onStateChangeRef.current(newState);
      }

      // Check completion
      if (controller.isCompleted()) {
        onCompleteRef.current();
        return; // stop the loop
      }

      const snap = controller.snapshot;
      const state = snap.state;
      const pProgress = snap.phaseProgress;
      const hProgress = snap.handoverProgress;
      const cam = snap.camera;
      const sLight = snap.sourceLight;
      const curVar = variationRef.current;
      const skipping = snap.isSkipping;

      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.46;
      const focalX = centerX - cam.x * 0.25;
      const focalY = centerY - cam.y * 0.25;

      // 1. Gravitational Lens
      const lensRadius = Math.min(width, height) * (0.35 + hProgress * 1.5);
      const lensGrad = ctx.createRadialGradient(
        focalX, focalY, lensRadius * 0.04,
        focalX, focalY, lensRadius
      );
      lensGrad.addColorStop(0, 'rgba(3, 3, 6, 0.98)');
      lensGrad.addColorStop(0.35, 'rgba(229, 169, 60, 0.04)');
      lensGrad.addColorStop(0.7, 'rgba(139, 92, 246, 0.02)');
      lensGrad.addColorStop(1, 'rgba(3, 3, 6, 0)');
      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(focalX, focalY, lensRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Geometry
      geometryAssembler.update(dt, skipping);
      geometryAssembler.render(ctx, width, height, state, pProgress, hProgress, cam, curVar);

      // 3. Particles (absolute position computation)
      particleField.render(ctx, cam, profile.enableLinks, profile.enableBlur, state, pProgress, hProgress, time, dt);

      // 4. Signal Emitter
      signalEmitter.update(time, dt, pProgress, state, curVar.rarePulsarEffect, sLight);
      signalEmitter.render(ctx, cam.x, cam.y, { x: sLight.x, y: sLight.y });

      // 5. Handover Aperture
      if (hProgress > 0.01) {
        const ar = Math.min(width, height) * (0.1 + Math.pow(hProgress, 1.8) * 3.5);
        const ax = focalX + hProgress * 80;
        const ay = focalY - hProgress * 30;
        const aGrad = ctx.createRadialGradient(ax, ay, ar * 0.05, ax, ay, ar);
        aGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        aGrad.addColorStop(0.3, 'rgba(229, 169, 60, 0.35)');
        aGrad.addColorStop(0.7, 'rgba(139, 92, 246, 0.1)');
        aGrad.addColorStop(1, 'rgba(3, 3, 6, 0)');
        ctx.fillStyle = aGrad;
        ctx.beginPath();
        ctx.arc(ax, ay, ar, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      destroyed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', applySize);
    };
  }, [controllerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block pointer-events-none z-10 select-none"
    />
  );
});
