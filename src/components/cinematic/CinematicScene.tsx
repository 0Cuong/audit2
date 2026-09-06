import { ReactNode } from 'react';
import { motion, Variants, useReducedMotion } from 'framer-motion';

interface CinematicSceneProps {
  children: ReactNode;
  sceneId?: string;
}

const variantsMap: Record<string, Variants> = {
  dash: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  },
  memories: {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 },
  },
  timeline: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },
  letters: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  },
  default: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  reduced: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }
};

export default function CinematicScene({ children, sceneId = 'default' }: CinematicSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? variantsMap.reduced : (variantsMap[sceneId] || variantsMap.default);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{
        duration: shouldReduceMotion ? 0.3 : 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative z-10 w-full min-h-screen"
      style={{ perspective: 1200 }}
    >
      {children}
    </motion.div>
  );
}
