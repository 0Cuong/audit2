import { ReactNode } from 'react';
import { motion, Variants, useReducedMotion } from 'framer-motion';

interface CinematicSceneProps {
  children: ReactNode;
  sceneId?: string;
}

const variantsMap: Record<string, Variants> = {
  dash: {
    initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.02, filter: 'blur(2px)' },
  },
  memories: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  timeline: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
  },
  letters: {
    initial: { opacity: 0, y: 20, rotateX: -10 },
    animate: { opacity: 1, y: 0, rotateX: 0 },
    exit: { opacity: 0, y: -20, rotateX: 10 },
  },
  default: {
    initial: { opacity: 0, y: 12, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.995 },
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
