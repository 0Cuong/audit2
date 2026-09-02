import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#E5A93C] via-[#8B5CF6] to-[#E5A93C] z-[60] origin-left pointer-events-none opacity-80"
      style={{ scaleX }} 
    />
  );
}