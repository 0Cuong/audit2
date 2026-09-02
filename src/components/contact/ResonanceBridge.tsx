import { motion } from 'framer-motion';

export default function ResonanceBridge() {
  return (
    <div className="hidden lg:flex items-center justify-center relative w-24 xl:w-32 my-auto select-none pointer-events-none">
      {/* Central Gravitational Alignment Core Marker */}
      <div className="relative flex flex-col items-center justify-center w-full">
        
        {/* Subtle Horizontal Resonance Axis Line */}
        <div className="w-full h-[1px] relative bg-gradient-to-r from-transparent via-[#E5A93C]/40 to-transparent">
          {/* Subtle Traveling Energy Quantum Node */}
          <motion.div
            animate={{
              x: ['-50%', '150%', '-50%'],
              opacity: [0.2, 0.85, 0.2],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-1/2 -translate-y-1/2 w-8 h-[2px] bg-gradient-to-r from-transparent via-[#E5A93C] to-transparent filter blur-[0.5px]"
          />
        </div>

        {/* Center Technical Crosshair / Resonance Diamond */}
        <div className="absolute my-auto flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.7, 0.35],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-4 h-4 rounded-full border border-[#E5A93C]/30 flex items-center justify-center bg-[#09090D]/80 backdrop-blur-sm"
          >
            <div className="w-1 h-1 rounded-full bg-[#E5A93C]" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
