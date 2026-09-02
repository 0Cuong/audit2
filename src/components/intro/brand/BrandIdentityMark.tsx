// ============================================================================
// BRAND IDENTITY MARK: THE DISCOVERED MONOLITH
// Natural geometric crystallization and lateral camera pass
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { type IntroState } from '../IntroStateMachine';

interface BrandIdentityMarkProps {
  currentState: IntroState;
  handoverProgress: number; // 0 to 1
}

export const BrandIdentityMark = memo(function BrandIdentityMark({
  currentState,
  handoverProgress,
}: BrandIdentityMarkProps) {
  const isVisible =
    currentState === 'SCALE' ||
    currentState === 'RECOGNITION' ||
    currentState === 'SILENCE' ||
    currentState === 'SECONDARY_DISCOVERY' ||
    currentState === 'CAMERA_ENTRY' ||
    currentState === 'HANDOVER';

  if (!isVisible) return null;

  const isEntering = currentState === 'CAMERA_ENTRY' || currentState === 'HANDOVER';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={
        isEntering
          ? {
              opacity: [1, 0.6, 0],
              x: -handoverProgress * 160,
              y: handoverProgress * 40,
              scale: 1 + handoverProgress * 0.6,
            }
          : {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
            }
      }
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center justify-center select-none pointer-events-none z-20 will-change-transform"
    >
      {/* Outer Resonant Harmonic Ring (Gold + Violet Diffraction) */}
      <motion.div
        animate={
          isEntering
            ? { scale: [1, 2.5], opacity: [0.6, 0] }
            : {
                scale: [1, 1.12, 1],
                opacity: [0.3, 0.6, 0.3],
                rotate: 360,
              }
        }
        transition={
          isEntering
            ? { duration: 0.6 }
            : {
                scale: { duration: 4.0, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 4.0, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 32, repeat: Infinity, ease: 'linear' },
              }
        }
        className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-[#E5A93C]/40 border-dashed"
      />

      {/* Secondary Counter-Rotating Ring */}
      <motion.div
        animate={
          isEntering
            ? { scale: [1, 2.0], opacity: [0.4, 0] }
            : {
                scale: [1.08, 0.96, 1.08],
                opacity: [0.18, 0.4, 0.18],
                rotate: -360,
              }
        }
        transition={
          isEntering
            ? { duration: 0.6 }
            : {
                scale: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 28, repeat: Infinity, ease: 'linear' },
              }
        }
        className="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full border border-[#8B5CF6]/30"
      />

      {/* Central Monolith Compass Housing */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-[#09090D] border border-white/20 flex items-center justify-center text-[#E5A93C]">
        {/* Subtle Light Sweep */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent pointer-events-none" />

        {/* Central Rotating Compass Core */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="relative"
        >
          <Compass className="w-8 h-8 sm:w-10 sm:h-10 text-[#E5A93C] drop-shadow-[0_0_12px_rgba(229,169,60,0.45)]" />
        </motion.div>
      </div>
    </motion.div>
  );
});
