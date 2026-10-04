import { ReactNode } from 'react';
import { motion, Variants, useReducedMotion } from 'framer-motion';

interface CinematicSceneProps {
  children: ReactNode;
  sceneId?: string;
}

const standardVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function CinematicScene({ children }: CinematicSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? reducedVariants : standardVariants;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.35,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative z-10 w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
}
