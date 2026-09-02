// ============================================================================
// INTRO EXPERIENCE — MASTER ORCHESTRATOR
// Fixed: stable useEffect deps (no restart on parent re-render),
//        single RAF loop (driven by IntroCanvasScene),
//        heartbeat stall detector (not fixed timer).
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IntroStateMachine, type IntroState } from './IntroStateMachine';
import { IntroController } from './IntroController';
import { IntroAssetLoader } from './IntroAssetLoader';
import { IntroStorage } from './IntroStorage';
import { IntroAccessibility } from './IntroAccessibility';
import { IntroVariationEngine } from './IntroVariationEngine';
import { IntroErrorBoundary } from './IntroErrorBoundary';
import { IntroCanvasScene } from './scene/IntroCanvasScene';
import { BrandIdentityMark } from './brand/BrandIdentityMark';
import { IntroTypography } from './brand/IntroTypography';
import { PortalMaskOverlay } from './transition/PortalMaskOverlay';
import { SkipButton } from './transition/SkipButton';
import { type VariationSeedConfig, VARIATION_SEEDS } from './config/introConfig';

declare global {
  interface Window {
    __CUONGISME_INTRO_ACTIVE?: boolean;
  }
}

export interface IntroExperienceProps {
  onComplete?: () => void;
  forceReplay?: boolean;
  brandName?: string;
  tagline?: string;
}

export default function IntroExperience({
  onComplete,
  forceReplay = false,
  brandName = 'CUONGISME',
  tagline = 'Nơi lưu giữ hành trình yêu của tụi mình',
}: IntroExperienceProps) {
  const [currentState, setCurrentState] = useState<IntroState>('PRELOADING');
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeVariation, setActiveVariation] = useState<VariationSeedConfig>(VARIATION_SEEDS.SEED_ALPHA);

  const stateMachineRef = useRef<IntroStateMachine | null>(null);
  const controllerRef = useRef<IntroController | null>(null);
  const onCompleteRef = useRef(onComplete);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // Keep onComplete ref fresh without causing useEffect restart
  onCompleteRef.current = onComplete;

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (typeof window !== 'undefined') {
      window.__CUONGISME_INTRO_ACTIVE = false;
    }
    IntroStorage.markVisited();
    setIsCompleted(true);
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  }, []); // stable — never changes

  const handleSkip = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.skip();
    } else {
      finish();
    }
  }, [finish]);

  const handleStateChange = useCallback((state: string) => {
    setCurrentState(state as IntroState);
  }, []);

  // ====== STABLE EFFECT — depends only on forceReplay (boolean) ======
  useEffect(() => {
    completedRef.current = false;
    if (typeof window !== 'undefined') {
      window.__CUONGISME_INTRO_ACTIVE = true;
    }

    const stateMachine = new IntroStateMachine('PRELOADING');
    stateMachineRef.current = stateMachine;

    const mode = IntroStorage.getPlaybackMode(forceReplay);
    const isReduced = IntroAccessibility.isReducedMotion();
    const visitCount = IntroStorage.getVisitCount();

    if (forceReplay) {
      IntroStorage.incrementReplay();
    }

    const variation = IntroVariationEngine.selectSeed(visitCount);
    setActiveVariation(variation);
    IntroAccessibility.announce('Đang mở ra không gian vũ trụ Cuongisme.');

    let isMounted = true;

    (async () => {
      await IntroAssetLoader.preloadAll();
      if (!isMounted) return;

      const controller = new IntroController(stateMachine, mode, isReduced, variation);
      controllerRef.current = controller;
      controller.start();

      // Heartbeat: only fires if RAF loop is truly dead (>3s no tick)
      heartbeatRef.current = setInterval(() => {
        if (!isMounted) return;
        if (controller.isStalled()) {
          console.warn('[IntroExperience] RAF stall detected (>3s), completing safely.');
          finish();
        }
      }, 2000);
    })();

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.__CUONGISME_INTRO_ACTIVE = false;
      }
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (controllerRef.current) controllerRef.current.destroy();
      stateMachine.destroy();
    };
  }, [forceReplay, finish]);

  const handleSequenceComplete = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.__CUONGISME_INTRO_ACTIVE = false;
    }
    setIsCompleted(true);
  }, []);

  const handoverProgress =
    currentState === 'CAMERA_ENTRY' ? 0.3 :
    currentState === 'HANDOVER' ? 0.75 :
    currentState === 'ARRIVAL' ? 1.0 : 0;

  return (
    <IntroErrorBoundary fallback={null}>
      <AnimatePresence mode="wait" onExitComplete={finish}>
        {!isCompleted && (
          <motion.div
            key="intro-container"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] bg-[#030306] flex flex-col items-center justify-center overflow-hidden select-none"
          >
            {/* Atmospheric Void */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(22,19,32,0.75)_0%,rgba(3,3,6,0.98)_75%)] pointer-events-none" />

            {/* Film Grain */}
            <div className="noise-overlay" />

            {/* Canvas — the SINGLE master RAF loop lives here */}
            <IntroCanvasScene
              controllerRef={controllerRef}
              variation={activeVariation}
              onStateChange={handleStateChange}
              onComplete={handleSequenceComplete}
            />

            {/* Brand Mark */}
            <div className="relative z-20 flex flex-col items-center justify-center px-4">
              <BrandIdentityMark
                currentState={currentState}
                handoverProgress={handoverProgress}
              />
              <IntroTypography
                currentState={currentState}
                brandName={brandName}
                tagline={tagline}
                handoverProgress={handoverProgress}
              />
            </div>

            {/* Portal Mask */}
            <PortalMaskOverlay handoverProgress={handoverProgress} />

            {/* Skip Button */}
            {currentState !== 'PRELOADING' && currentState !== 'VOID' && (
              <SkipButton progress={1} onSkip={handleSkip} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </IntroErrorBoundary>
  );
}
