import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CinematicSceneProps {
  children: ReactNode;
  sceneId?: string;
}

export default function CinematicScene({ children }: CinematicSceneProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.995 }}
      transition={{
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1], // Cinematic smooth easing
      }}
      className="relative z-10 w-full"
      style={{ perspective: 1200 }}
    >
      {children}
    </motion.div>
  );
}
