// ============================================================================
// INTRO TYPOGRAPHY: RESTRAINED BRAND REVEAL & LATERAL HANDOVER
// Clean editorial typography and lateral transition without cliché slogans
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { type IntroState } from '../IntroStateMachine';

interface IntroTypographyProps {
  currentState: IntroState;
  brandName?: string;
  tagline?: string;
  handoverProgress: number;
}

export const IntroTypography = memo(function IntroTypography({
  currentState,
  brandName = 'CUONGISME',
  tagline = 'Nơi lưu giữ hành trình yêu của tụi mình',
  handoverProgress,
}: IntroTypographyProps) {
  const isVisible =
    currentState === 'RECOGNITION' ||
    currentState === 'SILENCE' ||
    currentState === 'SECONDARY_DISCOVERY' ||
    currentState === 'CAMERA_ENTRY' ||
    currentState === 'HANDOVER';

  if (!isVisible) return null;

  const isEntering = currentState === 'CAMERA_ENTRY' || currentState === 'HANDOVER';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={
        isEntering
          ? {
              opacity: Math.max(0, 1 - handoverProgress * 1.5),
              x: -handoverProgress * 140, // Lateral slide
              y: handoverProgress * 20,
            }
          : { opacity: 1, y: 0, x: 0 }
      }
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-2 mt-6 text-center select-none pointer-events-none z-20"
    >
      {/* Brand Master Headline */}
      <motion.h1
        initial={{ letterSpacing: '0.25em', opacity: 0 }}
        animate={{ letterSpacing: '0.45em', opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="text-sm sm:text-base md:text-lg font-mono font-bold tracking-widest text-zinc-100 uppercase"
      >
        {brandName}
      </motion.h1>

      {/* Editorial Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 0.85, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-xs sm:text-sm font-serif italic text-zinc-300 max-w-xs sm:max-w-md tracking-wide px-4"
      >
        "{tagline}"
      </motion.p>
    </motion.div>
  );
});
